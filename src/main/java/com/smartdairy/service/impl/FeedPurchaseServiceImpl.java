package com.smartdairy.service.impl;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.smartdairy.dto.FeedChartPointResponse;
import com.smartdairy.dto.FeedPurchaseRequest;
import com.smartdairy.dto.FeedPurchaseResponse;
import com.smartdairy.dto.FeedSummaryResponse;
import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.FeedPurchase;
import com.smartdairy.entity.Payment;
import com.smartdairy.entity.User;
import com.smartdairy.exception.ResourceNotFoundException;
import com.smartdairy.repository.FarmerRepository;
import com.smartdairy.repository.FeedPurchaseRepository;
import com.smartdairy.repository.PaymentRepository;
import com.smartdairy.service.DairyProfileService;
import com.smartdairy.service.FeedPurchaseService;
import com.smartdairy.service.UserService;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FeedPurchaseServiceImpl implements FeedPurchaseService {

    private final FeedPurchaseRepository feedPurchaseRepository;
    private final FarmerRepository farmerRepository;
    private final PaymentRepository paymentRepository;
    private final DairyProfileService dairyProfileService;
    private final com.smartdairy.service.SmsNotificationService smsNotificationService;
    private final UserService userService;

    @Override
    @Transactional
    public FeedPurchaseResponse create(FeedPurchaseRequest request) {
        User admin = userService.getLoggedInUser();
        Farmer farmer = farmerRepository.findByIdAndAdmin(request.getFarmerId(), admin)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found with id: " + request.getFarmerId()));
        BigDecimal total = request.getFeedQuantity()
                .multiply(request.getRatePerUnit())
                .setScale(2, RoundingMode.HALF_UP);
        FeedPurchase f = FeedPurchase.builder()
                .admin(admin)
                .farmer(farmer)
                .feedDate(request.getFeedDate())
                .feedType(request.getFeedType().trim())
                .feedCompanyName(request.getFeedCompanyName().trim())
                .feedQuantity(request.getFeedQuantity().setScale(2, RoundingMode.HALF_UP))
                .unitType(request.getUnitType().trim())
                .ratePerUnit(request.getRatePerUnit().setScale(2, RoundingMode.HALF_UP))
                .totalAmount(total)
                .remainingAmount(total)
                .notes(request.getNotes())
                .build();
        f = feedPurchaseRepository.save(f);
        String sms = smsNotificationService.sendFeedPurchaseNotification(f);
        return toResponse(f, sms);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeedPurchaseResponse> list(Long farmerId, LocalDate from, LocalDate to) {
        User admin = userService.getLoggedInUser();
        List<FeedPurchase> rows;
        if (farmerId != null) {
            findFarmerForAdmin(farmerId, admin);
            rows = feedPurchaseRepository.findByAdminAndFarmer_IdOrderByFeedDateDescCreatedAtDesc(admin, farmerId);
        } else if (from != null && to != null) {
            rows = feedPurchaseRepository.findByAdminAndFeedDateBetweenOrderByFeedDateDescCreatedAtDesc(admin, from, to);
        } else {
            rows = feedPurchaseRepository.findByAdmin(admin).stream()
                    .sorted((a, b) -> b.getFeedDate().compareTo(a.getFeedDate()))
                    .toList();
        }
        return rows.stream().map(f -> toResponse(f, null)).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public FeedSummaryResponse summary(LocalDate from, LocalDate to) {
        User admin = userService.getLoggedInUser();
        return FeedSummaryResponse.builder()
                .from(from)
                .to(to)
                .purchaseCount(feedPurchaseRepository.countByAdminAndFeedDateBetween(admin, from, to))
                .totalQuantity(feedPurchaseRepository.sumQuantityByAdminAndFeedDateBetween(admin, from, to)
                        .setScale(2, RoundingMode.HALF_UP))
                .totalAmount(feedPurchaseRepository.sumTotalAmountByAdminAndFeedDateBetween(admin, from, to)
                        .setScale(2, RoundingMode.HALF_UP))
                .outstandingAmount(feedPurchaseRepository.sumOutstandingByAdminAndFeedDateBetween(admin, from, to)
                        .setScale(2, RoundingMode.HALF_UP))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeedChartPointResponse> chart(LocalDate from, LocalDate to) {
        User admin = userService.getLoggedInUser();
        return feedPurchaseRepository.sumAmountGroupedByDateForAdmin(admin, from, to).stream()
                .map(r -> FeedChartPointResponse.builder()
                        .date((LocalDate) r[0])
                        .amount(((BigDecimal) r[1]).setScale(2, RoundingMode.HALF_UP))
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] export(LocalDate from, LocalDate to, Long farmerId, String format) {
        List<FeedPurchase> rows = listRowsForExport(from, to, farmerId);
        boolean xlsx = format != null && (format.equalsIgnoreCase("xlsx") || format.equalsIgnoreCase("excel"));
        return xlsx ? exportExcel(rows, from, to) : exportPdf(rows, from, to);
    }

    @Override
    @Transactional
    public BigDecimal applyOutstandingDeductionForPayment(Long farmerId, BigDecimal availableAmount, Long paymentId) {
        if (availableAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        User admin = userService.getLoggedInUser();
        Payment payment = paymentRepository.findByAdminAndId(admin, paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));
        BigDecimal remainingForDeduction = availableAmount;
        BigDecimal deducted = BigDecimal.ZERO;
        List<FeedPurchase> outstanding = feedPurchaseRepository.findOutstandingByAdminAndFarmer(admin, farmerId);
        for (FeedPurchase f : outstanding) {
            if (remainingForDeduction.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }
            BigDecimal canSettle = f.getRemainingAmount().min(remainingForDeduction).setScale(2, RoundingMode.HALF_UP);
            if (canSettle.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            f.setRemainingAmount(f.getRemainingAmount().subtract(canSettle).setScale(2, RoundingMode.HALF_UP));
            if (f.getRemainingAmount().compareTo(BigDecimal.ZERO) == 0) {
                f.setSettledInPayment(payment);
            }
            feedPurchaseRepository.save(f);
            remainingForDeduction = remainingForDeduction.subtract(canSettle);
            deducted = deducted.add(canSettle);
        }
        return deducted.setScale(2, RoundingMode.HALF_UP);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getOutstandingByFarmer(Long farmerId) {
        User admin = userService.getLoggedInUser();
        return feedPurchaseRepository.sumOutstandingByAdminAndFarmer(admin, farmerId)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private List<FeedPurchase> listRowsForExport(LocalDate from, LocalDate to, Long farmerId) {
        User admin = userService.getLoggedInUser();
        if (farmerId != null && from != null && to != null) {
            findFarmerForAdmin(farmerId, admin);
            return feedPurchaseRepository.findByAdminAndFarmer_IdOrderByFeedDateDescCreatedAtDesc(admin, farmerId)
                    .stream()
                    .filter(f -> !f.getFeedDate().isBefore(from) && !f.getFeedDate().isAfter(to))
                    .toList();
        }
        if (from != null && to != null) {
            return feedPurchaseRepository.findByAdminAndFeedDateBetweenOrderByFeedDateDescCreatedAtDesc(admin, from, to);
        }
        return feedPurchaseRepository.findByAdmin(admin);
    }

    private byte[] exportPdf(List<FeedPurchase> rows, LocalDate from, LocalDate to) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document document = new Document();
            PdfWriter.getInstance(document, baos);
            document.open();
            Font title = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, Color.DARK_GRAY);
            Font small = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK);
            var dairy = dairyProfileService.getCurrentUserProfile();
            document.add(new Paragraph(dairy.getDairyName() + " — Feed Purchase Report", title));
            document.add(new Paragraph("Range: " + from + " to " + to, small));
            document.add(new Paragraph(" ", small));
            PdfPTable table = new PdfPTable(8);
            table.setWidthPercentage(100);
            for (String h : List.of("Date", "Farmer", "Type", "Company", "Qty", "Rate", "Total", "Remaining")) {
                PdfPCell c = new PdfPCell(new Paragraph(h, small));
                c.setBackgroundColor(new Color(230, 240, 235));
                table.addCell(c);
            }
            for (FeedPurchase f : rows) {
                table.addCell(new Paragraph(f.getFeedDate().toString(), small));
                table.addCell(new Paragraph(f.getFarmer().getFullName(), small));
                table.addCell(new Paragraph(f.getFeedType(), small));
                table.addCell(new Paragraph(f.getFeedCompanyName(), small));
                table.addCell(new Paragraph(f.getFeedQuantity() + " " + f.getUnitType(), small));
                table.addCell(new Paragraph(f.getRatePerUnit().toString(), small));
                table.addCell(new Paragraph(f.getTotalAmount().toString(), small));
                table.addCell(new Paragraph(f.getRemainingAmount().toString(), small));
            }
            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Feed PDF export failed", e);
        }
    }

    private byte[] exportExcel(List<FeedPurchase> rows, LocalDate from, LocalDate to) {
        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Sheet sh = wb.createSheet("Feed purchases");
            int r = 0;
            sh.createRow(r++).createCell(0).setCellValue("Feed purchases: " + from + " to " + to);
            Row h = sh.createRow(r++);
            String[] cols = {"Date", "Farmer", "Type", "Company", "Qty", "Unit", "Rate", "Total", "Remaining", "Notes"};
            for (int i = 0; i < cols.length; i++) {
                h.createCell(i).setCellValue(cols[i]);
            }
            for (FeedPurchase f : rows) {
                Row row = sh.createRow(r++);
                row.createCell(0).setCellValue(f.getFeedDate().toString());
                row.createCell(1).setCellValue(f.getFarmer().getFullName());
                row.createCell(2).setCellValue(f.getFeedType());
                row.createCell(3).setCellValue(f.getFeedCompanyName());
                row.createCell(4).setCellValue(f.getFeedQuantity().doubleValue());
                row.createCell(5).setCellValue(f.getUnitType());
                row.createCell(6).setCellValue(f.getRatePerUnit().doubleValue());
                row.createCell(7).setCellValue(f.getTotalAmount().doubleValue());
                row.createCell(8).setCellValue(f.getRemainingAmount().doubleValue());
                row.createCell(9).setCellValue(f.getNotes() == null ? "" : f.getNotes());
            }
            for (int i = 0; i < cols.length; i++) {
                sh.autoSizeColumn(i);
            }
            wb.write(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Feed Excel export failed", e);
        }
    }

    private FeedPurchaseResponse toResponse(FeedPurchase f, String smsNotification) {
        return FeedPurchaseResponse.builder()
                .id(f.getId())
                .farmerId(f.getFarmer().getId())
                .farmerName(f.getFarmer().getFullName())
                .feedDate(f.getFeedDate())
                .feedType(f.getFeedType())
                .feedCompanyName(f.getFeedCompanyName())
                .feedQuantity(f.getFeedQuantity())
                .unitType(f.getUnitType())
                .ratePerUnit(f.getRatePerUnit())
                .totalAmount(f.getTotalAmount())
                .remainingAmount(f.getRemainingAmount())
                .notes(f.getNotes())
                .settledPaymentId(f.getSettledInPayment() != null ? f.getSettledInPayment().getId() : null)
                .createdAt(f.getCreatedAt())
                .smsNotification(smsNotification)
                .build();
    }

    private Farmer findFarmerForAdmin(Long farmerId, User admin) {
        return farmerRepository.findByIdAndAdmin(farmerId, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found with id: " + farmerId));
    }
}

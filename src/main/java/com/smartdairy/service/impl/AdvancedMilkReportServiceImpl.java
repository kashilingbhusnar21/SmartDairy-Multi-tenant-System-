package com.smartdairy.service.impl;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.smartdairy.dto.AdvancedMilkReportFarmerRow;
import com.smartdairy.dto.AdvancedMilkReportResponse;
import com.smartdairy.dto.DairyProfileResponse;
import com.smartdairy.entity.MilkCollection;
import com.smartdairy.entity.User;
import com.smartdairy.exception.ResourceNotFoundException;
import com.smartdairy.repository.FarmerRepository;
import com.smartdairy.repository.FeedPurchaseRepository;
import com.smartdairy.repository.MilkCollectionRepository;
import com.smartdairy.service.AdvancedMilkReportService;
import com.smartdairy.service.UserService;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdvancedMilkReportServiceImpl implements AdvancedMilkReportService {

    private final MilkCollectionRepository milkCollectionRepository;
    private final FeedPurchaseRepository feedPurchaseRepository;
    private final FarmerRepository farmerRepository;
    private final com.smartdairy.service.DairyProfileService dairyProfileService;
    private final UserService userService;

    @Override
    @Transactional(readOnly = true)
    public AdvancedMilkReportResponse buildReport(LocalDate from, LocalDate to, Long farmerId) {
        User admin = userService.getLoggedInUser();
        if (farmerId != null) {
            farmerRepository.findByIdAndAdmin(farmerId, admin)
                    .orElseThrow(() -> new ResourceNotFoundException("Farmer not found with id: " + farmerId));
        }

        List<MilkCollection> rows = loadRows(from, to, farmerId);
        BigDecimal checksum = farmerId == null
                ? milkCollectionRepository.sumTotalAmountBetweenForAdmin(admin, from, to)
                : milkCollectionRepository.sumTotalAmountBetweenForAdminAndFarmer(admin, from, to, farmerId);

        Map<Long, Agg> grouped = new LinkedHashMap<>();
        for (MilkCollection m : rows) {
            Long fid = m.getFarmer().getId();
            Agg a = grouped.computeIfAbsent(fid, id -> new Agg(m.getFarmer().getFullName()));
            a.qty = a.qty.add(m.getQuantityLiters());
            a.amount = a.amount.add(m.getTotalAmount());
            a.fatWeighted = a.fatWeighted.add(m.getFatPercentage().multiply(m.getQuantityLiters()));
            a.snfWeighted = a.snfWeighted.add(m.getSnfPercentage().multiply(m.getQuantityLiters()));
        }

        List<AdvancedMilkReportFarmerRow> farmerRows = new ArrayList<>();
        BigDecimal grandQty = BigDecimal.ZERO;
        BigDecimal grandAmt = BigDecimal.ZERO;
        BigDecimal grandFatW = BigDecimal.ZERO;
        BigDecimal grandSnfW = BigDecimal.ZERO;

        for (Map.Entry<Long, Agg> e : grouped.entrySet()) {
            Agg a = e.getValue();
            AdvancedMilkReportFarmerRow row = toFarmerRow(e.getKey(), a, from, to);
            farmerRows.add(row);
            grandQty = grandQty.add(a.qty);
            grandAmt = grandAmt.add(a.amount);
            grandFatW = grandFatW.add(a.fatWeighted);
            grandSnfW = grandSnfW.add(a.snfWeighted);
        }

        BigDecimal sumRowTotals =
                farmerRows.stream().map(AdvancedMilkReportFarmerRow::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalFeed = (farmerId == null
                        ? feedPurchaseRepository.sumTotalAmountBetweenForAdmin(admin, from, to)
                        : feedPurchaseRepository.sumTotalAmountBetweenForAdminAndFarmer(admin, from, to, farmerId))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal chk = checksum.setScale(2, RoundingMode.HALF_UP);
        BigDecimal agg = sumRowTotals.setScale(2, RoundingMode.HALF_UP);
        boolean match = chk.compareTo(agg) == 0;

        return AdvancedMilkReportResponse.builder()
                .dateFrom(from)
                .dateTo(to)
                .farmerCount(farmerRows.size())
                .totalMilkQuantity(grandQty.setScale(2, RoundingMode.HALF_UP))
                .totalAmount(grandAmt.setScale(2, RoundingMode.HALF_UP))
                .totalFeedDeduction(totalFeed)
                .netAmountAfterFeed(grandAmt.subtract(totalFeed).setScale(2, RoundingMode.HALF_UP))
                .averageFat(divideOrZero(grandFatW, grandQty))
                .averageSnf(divideOrZero(grandSnfW, grandQty))
                .averageRatePerLiter(divideOrZero(grandAmt, grandQty))
                .farmers(farmerRows)
                .checksumTotalFromEntries(chk)
                .totalsMatch(match)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportAdvancedReport(LocalDate from, LocalDate to, Long farmerId, String format) {
        AdvancedMilkReportResponse report = buildReport(from, to, farmerId);
        String title = "Advanced milk summary — " + from + " to " + to;
        if (format != null && (format.equalsIgnoreCase("xlsx") || format.equalsIgnoreCase("excel"))) {
            return buildExcel(report, title);
        }
        return buildPdf(report, title);
    }

    private List<MilkCollection> loadRows(LocalDate from, LocalDate to, Long farmerId) {
        User admin = userService.getLoggedInUser();
        if (farmerId == null) {
            return milkCollectionRepository.findByAdminAndDateBetweenOrderByDateAscFarmer_FullNameAsc(admin, from, to);
        }
        return milkCollectionRepository.findDetailedForAdminAndFarmerBetween(admin, farmerId, from, to);
    }

    private AdvancedMilkReportFarmerRow toFarmerRow(Long farmerId, Agg a, LocalDate from, LocalDate to) {
        User admin = userService.getLoggedInUser();
        BigDecimal feed = feedPurchaseRepository
                .sumTotalAmountBetweenForAdminAndFarmer(admin, from, to, farmerId)
                .setScale(2, RoundingMode.HALF_UP);
        return AdvancedMilkReportFarmerRow.builder()
                .farmerId(farmerId)
                .farmerName(a.name)
                .totalMilkQuantity(a.qty.setScale(2, RoundingMode.HALF_UP))
                .totalAmount(a.amount.setScale(2, RoundingMode.HALF_UP))
                .feedDeductionAmount(feed)
                .netAmountAfterFeed(a.amount.subtract(feed).setScale(2, RoundingMode.HALF_UP))
                .averageFat(divideOrZero(a.fatWeighted, a.qty))
                .averageSnf(divideOrZero(a.snfWeighted, a.qty))
                .averageRatePerLiter(divideOrZero(a.amount, a.qty))
                .build();
    }

    private static BigDecimal divideOrZero(BigDecimal num, BigDecimal den) {
        if (den == null || den.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return num.divide(den, 2, RoundingMode.HALF_UP);
    }

    private byte[] buildPdf(AdvancedMilkReportResponse r, String title) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document document = new Document();
            PdfWriter.getInstance(document, baos);
            document.open();
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Color.DARK_GRAY);
            Font small = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK);
            DairyProfileResponse dairy = dairyProfileService.getCurrentUserProfile();
            document.add(new Paragraph(title, titleFont));
            document.add(new Paragraph(
                    dairy.getDairyName() + " | Owner: " + dairy.getOwnerName() + " | Contact: " + dairy.getContactNumber(),
                    small));
            document.add(new Paragraph(
                    "Period: " + r.getDateFrom() + " — " + r.getDateTo()
                            + " | Farmers: "
                            + r.getFarmerCount()
                            + " | Total milk: "
                            + r.getTotalMilkQuantity()
                            + " L | Total amount: ₹ "
                            + r.getTotalAmount()
                            + " | Feed deduction: ₹ "
                            + r.getTotalFeedDeduction()
                            + " | Net amount: ₹ "
                            + r.getNetAmountAfterFeed()
                            + " | Avg fat: "
                            + r.getAverageFat()
                            + " | Avg SNF: "
                            + r.getAverageSnf()
                            + " | Avg rate: ₹ "
                            + r.getAverageRatePerLiter()
                            + "/L | Totals match entries: "
                            + r.isTotalsMatch(),
                    small));
            document.add(new Paragraph(" ", small));

            PdfPTable table = new PdfPTable(9);
            table.setWidthPercentage(100);
            addH(table, "Farmer", small);
            addH(table, "Date range", small);
            addH(table, "Total L", small);
            addH(table, "Total ₹", small);
            addH(table, "Feed ₹", small);
            addH(table, "Net ₹", small);
            addH(table, "Avg fat", small);
            addH(table, "Avg SNF", small);
            addH(table, "Avg ₹/L", small);

            String dr = r.getDateFrom() + " to " + r.getDateTo();
            for (AdvancedMilkReportFarmerRow row : r.getFarmers()) {
                table.addCell(new PdfPCell(new Paragraph(row.getFarmerName(), small)));
                table.addCell(new PdfPCell(new Paragraph(dr, small)));
                table.addCell(new PdfPCell(new Paragraph(row.getTotalMilkQuantity().toString(), small)));
                table.addCell(new PdfPCell(new Paragraph(row.getTotalAmount().toString(), small)));
                table.addCell(new PdfPCell(new Paragraph(row.getFeedDeductionAmount().toString(), small)));
                table.addCell(new PdfPCell(new Paragraph(row.getNetAmountAfterFeed().toString(), small)));
                table.addCell(new PdfPCell(new Paragraph(row.getAverageFat().toString(), small)));
                table.addCell(new PdfPCell(new Paragraph(row.getAverageSnf().toString(), small)));
                table.addCell(new PdfPCell(new Paragraph(row.getAverageRatePerLiter().toString(), small)));
            }
            if (r.getFarmers().isEmpty()) {
                PdfPCell empty = new PdfPCell(new Paragraph("No records in this range.", small));
                empty.setColspan(9);
                table.addCell(empty);
            }
            document.add(table);
            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Advanced PDF export failed", e);
        }
    }

    private void addH(PdfPTable table, String text, Font font) {
        PdfPCell c = new PdfPCell(new Paragraph(text, font));
        c.setBackgroundColor(new Color(230, 240, 235));
        table.addCell(c);
    }

    private byte[] buildExcel(AdvancedMilkReportResponse r, String title) {
        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Advanced report");
            int rowIdx = 0;
            DairyProfileResponse dairy = dairyProfileService.getCurrentUserProfile();
            sheet.createRow(rowIdx++).createCell(0).setCellValue(title);
            sheet.createRow(rowIdx++)
                    .createCell(0)
                    .setCellValue(
                            dairy.getDairyName() + " | Owner: " + dairy.getOwnerName() + " | Contact: " + dairy.getContactNumber());
            sheet.createRow(rowIdx++)
                    .createCell(0)
                    .setCellValue("Period: " + r.getDateFrom() + " — " + r.getDateTo());
            sheet.createRow(rowIdx++)
                    .createCell(0)
                    .setCellValue("Summary: total L=" + r.getTotalMilkQuantity() + ", total ₹="
                            + r.getTotalAmount()
                            + ", feed ₹="
                            + r.getTotalFeedDeduction()
                            + ", net ₹="
                            + r.getNetAmountAfterFeed()
                            + ", avg fat="
                            + r.getAverageFat()
                            + ", avg SNF="
                            + r.getAverageSnf()
                            + ", avg rate="
                            + r.getAverageRatePerLiter()
                            + ", checksum ₹="
                            + r.getChecksumTotalFromEntries()
                            + ", match="
                            + r.isTotalsMatch());
            rowIdx++;

            Row header = sheet.createRow(rowIdx++);
            String[] cols = {"Farmer", "Date range", "Total L", "Total ₹", "Feed ₹", "Net ₹", "Avg fat", "Avg SNF", "Avg ₹/L"};
            for (int i = 0; i < cols.length; i++) {
                header.createCell(i).setCellValue(cols[i]);
            }
            String dr = r.getDateFrom() + " to " + r.getDateTo();
            for (AdvancedMilkReportFarmerRow row : r.getFarmers()) {
                Row x = sheet.createRow(rowIdx++);
                x.createCell(0).setCellValue(row.getFarmerName());
                x.createCell(1).setCellValue(dr);
                x.createCell(2).setCellValue(row.getTotalMilkQuantity().doubleValue());
                x.createCell(3).setCellValue(row.getTotalAmount().doubleValue());
                x.createCell(4).setCellValue(row.getFeedDeductionAmount().doubleValue());
                x.createCell(5).setCellValue(row.getNetAmountAfterFeed().doubleValue());
                x.createCell(6).setCellValue(row.getAverageFat().doubleValue());
                x.createCell(7).setCellValue(row.getAverageSnf().doubleValue());
                x.createCell(8).setCellValue(row.getAverageRatePerLiter().doubleValue());
            }
            for (int i = 0; i < 9; i++) {
                sheet.autoSizeColumn(i);
            }
            wb.write(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Advanced Excel export failed", e);
        }
    }

    private static final class Agg {
        final String name;
        BigDecimal qty = BigDecimal.ZERO;
        BigDecimal amount = BigDecimal.ZERO;
        BigDecimal fatWeighted = BigDecimal.ZERO;
        BigDecimal snfWeighted = BigDecimal.ZERO;

        Agg(String name) {
            this.name = name;
        }
    }
}

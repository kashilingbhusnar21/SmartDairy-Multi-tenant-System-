package com.smartdairy.service.impl;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.smartdairy.dto.FarmerBillLineItemResponse;
import com.smartdairy.dto.FarmerBillResponse;
import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.FarmerFinancialAccount;
import com.smartdairy.entity.FarmerFinancialTransaction;
import com.smartdairy.entity.MilkCollection;
import com.smartdairy.entity.User;
import com.smartdairy.exception.ResourceNotFoundException;
import com.smartdairy.entity.FarmerBill;
import com.smartdairy.repository.FarmerBillRepository;
import com.smartdairy.repository.FarmerFinancialAccountRepository;
import com.smartdairy.repository.FarmerFinancialTransactionRepository;
import com.smartdairy.repository.FarmerRepository;
import com.smartdairy.repository.FeedPurchaseRepository;
import com.smartdairy.repository.MilkCollectionRepository;
import com.smartdairy.service.DairyProfileService;
import com.smartdairy.service.FarmerFinancialAccountService;
import com.smartdairy.service.FarmerBillService;
import com.smartdairy.service.FinancialCalculationService;
import com.smartdairy.service.FinancialRecoveryService;
import com.smartdairy.service.UserService;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Base64;
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
public class FarmerBillServiceImpl implements FarmerBillService {

    private final FarmerRepository farmerRepository;
    private final MilkCollectionRepository milkCollectionRepository;
    private final FeedPurchaseRepository feedPurchaseRepository;
    private final FarmerBillRepository farmerBillRepository;
    private final FarmerFinancialAccountRepository financialAccountRepository;
    private final FarmerFinancialAccountService financialAccountService;
    private final FarmerFinancialTransactionRepository financialTransactionRepository;
    private final DairyProfileService dairyProfileService;
    private final UserService userService;
    private final FinancialCalculationService financialCalculationService;
    private final FinancialRecoveryService financialRecoveryService;

    @Override
    @Transactional
    public FarmerBillResponse preview(
            Long farmerId,
            LocalDate from,
            LocalDate to) {
        User admin = userService.getLoggedInUser();
        Farmer farmer = farmerRepository.findByIdAndAdmin(farmerId, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found with id: " + farmerId));
        List<MilkCollection> rows =
                milkCollectionRepository.findDetailedForAdminAndFarmerBetween(admin, farmerId, from, to);
        var dairy = dairyProfileService.getCurrentUserProfile();

        FarmerFinancialAccount financialAccount = financialAccountRepository.findByAdminAndFarmer(admin, farmer)
                .orElse(null);

        BigDecimal pendingAdvance = financialAccount != null ? financialAccount.getPendingAdvance() : BigDecimal.ZERO;
        BigDecimal pendingLoan = financialAccount != null ? financialAccount.getPendingLoan() : BigDecimal.ZERO;
        BigDecimal pendingOther = financialAccount != null ? financialAccount.getPendingOther() : BigDecimal.ZERO;

        BigDecimal adv = pendingAdvance;
        BigDecimal loan = pendingLoan;
        BigDecimal other = pendingOther;

        var existingBills = farmerBillRepository.findByAdminAndFarmerIdAndFromDateAndToDate(admin, farmerId, from, to);
        FarmerBill existingBill = null;
        if (!existingBills.isEmpty()) {
            existingBill = existingBills.get(0);
            adv = existingBill.getAdvancePayment();
            loan = existingBill.getLoanAmount();
            other = existingBill.getOtherDeductions();
            if (existingBills.size() > 1) {
                List<Long> duplicateIds = new java.util.ArrayList<>();
                for (int i = 1; i < existingBills.size(); i++) {
                    duplicateIds.add(existingBills.get(i).getId());
                }
                if (!duplicateIds.isEmpty()) {
                    farmerBillRepository.deleteAllById(duplicateIds);
                }
            }
        }

        BigDecimal totalLiters = BigDecimal.ZERO;
        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal fatWeighted = BigDecimal.ZERO;
        BigDecimal snfWeighted = BigDecimal.ZERO;

        List<FarmerBillLineItemResponse> items = rows.stream().map(m -> {
            return FarmerBillLineItemResponse.builder()
                    .date(m.getDate())
                    .milkType(m.getShift() == null ? "Milk" : m.getShift().name())
                    .liters(m.getQuantityLiters())
                    .fat(m.getFatPercentage())
                    .snf(m.getSnfPercentage())
                    .rate(m.getRatePerLiter())
                    //.amount(m.getTotalAmount())
                    .build();
        }).toList();

        for (MilkCollection m : rows) {
            totalLiters = totalLiters.add(m.getQuantityLiters());
            totalAmount = totalAmount.add(m.getTotalAmount());
            fatWeighted = fatWeighted.add(m.getFatPercentage().multiply(m.getQuantityLiters()));
            snfWeighted = snfWeighted.add(m.getSnfPercentage().multiply(m.getQuantityLiters()));
        }

        var calculation = financialCalculationService.calculateBill(
                farmerId, from, to, totalAmount, adv, loan, other);
        
        BigDecimal feedDeduction = calculation.feedDeduction();
        BigDecimal finalPayable = calculation.netPayable();

        FarmerBill bill;
        if (existingBill != null) {
            bill = existingBill;
            bill.setTotalAmount(calculation.milkBillAmount());
            bill.setFeedDeduction(feedDeduction);
            bill.setAdvancePayment(adv);
            bill.setLoanAmount(loan);
            bill.setOtherDeductions(other);
            bill.setFinalPayableAmount(finalPayable);
            farmerBillRepository.save(bill);
        } else {
            bill = FarmerBill.builder()
                    .admin(admin)
                    .farmer(farmer)
                    .fromDate(from)
                    .toDate(to)
                    .totalAmount(calculation.milkBillAmount())
                    .feedDeduction(feedDeduction)
                    .advancePayment(adv)
                    .loanAmount(loan)
                    .otherDeductions(other)
                    .finalPayableAmount(finalPayable)
                    .build();
            farmerBillRepository.save(bill);
        }

        return FarmerBillResponse.builder()
                .invoiceNumber("INV-" + farmerId + "-" + from.toString().replace("-", "") + "-" + to.toString().replace("-", ""))
                .from(from)
                .to(to)
                .farmerId(farmerId)
                .farmerName(farmer.getFullName())
                .dairyName(dairy.getDairyName())
                .ownerName(dairy.getOwnerName())
                .dairyAddress(dairy.getDairyAddress())
                .contactNumber(dairy.getContactNumber())
                .dairyLogo(dairy.getDairyLogo())
                .items(items)
                .totalMilkQuantity(totalLiters.setScale(2, RoundingMode.HALF_UP))
                .averageFat(div(totalLiters, fatWeighted))
                .averageSnf(div(totalLiters, snfWeighted))
                .averageRate(div(totalLiters, totalAmount))
                .totalAmount(calculation.milkBillAmount())
                .feedDeduction(feedDeduction)
                .advancePayment(adv)
                .loanAmount(loan)
                .otherDeductions(other)
                .finalPayableAmount(finalPayable)
                .pendingAdvance(calculation.pendingAdvanceBefore())
                .pendingLoan(calculation.pendingLoanBefore())
                .pendingOther(calculation.pendingOtherBefore())
                .build();
    }

    @Override
    @Transactional
    public FarmerBillResponse generateFinalBill(
            Long farmerId,
            LocalDate from,
            LocalDate to) {
        User admin = userService.getLoggedInUser();
        Farmer farmer = farmerRepository.findByIdAndAdmin(farmerId, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found with id: " + farmerId));

        FarmerFinancialAccount financialAccount = financialAccountService.getOrCreateAccountByFarmer(farmerId);

        BigDecimal adv = financialAccount.getPendingAdvance();
        BigDecimal loan = financialAccount.getPendingLoan();
        BigDecimal other = financialAccount.getPendingOther();

        var calculation = financialCalculationService.calculateBill(
                farmerId, from, to, BigDecimal.ZERO, adv, loan, other);
        
        BigDecimal feedDeduction = calculation.feedDeduction();
        BigDecimal totalOtherRecovery = other;
        
        if (adv.compareTo(financialAccount.getPendingAdvance()) > 0) {
            throw new IllegalArgumentException("Advance payment cannot exceed pending advance. Pending: " + financialAccount.getPendingAdvance() + ", Requested: " + adv);
        }
        if (loan.compareTo(financialAccount.getPendingLoan()) > 0) {
            throw new IllegalArgumentException("Loan recovery cannot exceed pending loan. Pending: " + financialAccount.getPendingLoan() + ", Requested: " + loan);
        }
        if (totalOtherRecovery.compareTo(financialAccount.getPendingOther()) > 0) {
            throw new IllegalArgumentException("Total other deduction recovery cannot exceed pending other. Pending: " + financialAccount.getPendingOther() + ", Requested: " + totalOtherRecovery);
        }

        FarmerBill bill = FarmerBill.builder()
                .admin(admin)
                .farmer(farmer)
                .fromDate(from)
                .toDate(to)
                .totalAmount(calculation.milkBillAmount())
                .feedDeduction(feedDeduction)
                .advancePayment(adv)
                .loanAmount(loan)
                .otherDeductions(other)
                .finalPayableAmount(calculation.netPayable())
                .finalized(true)
                .finalizedAt(java.time.Instant.now())
                .build();
        bill = farmerBillRepository.save(bill);

        financialRecoveryService.recoverBillDeductions(admin, farmer, financialAccount, bill);

        return preview(farmerId, from, to);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] export(
            Long farmerId,
            LocalDate from,
            LocalDate to,
            String format) {
        FarmerBillResponse bill = preview(farmerId, from, to);
        boolean xlsx = format != null && (format.equalsIgnoreCase("xlsx") || format.equalsIgnoreCase("excel"));
        return xlsx ? excel(bill) : pdf(bill);
    }

    private byte[] pdf(FarmerBillResponse b) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document doc = new Document();
            PdfWriter.getInstance(doc, baos);
            doc.open();

            Font h = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Color.DARK_GRAY);
            Font s = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK);

            addLogoIfAny(doc, b.getDairyLogo());
            doc.add(new Paragraph(b.getDairyName(), h));
            doc.add(new Paragraph("Owner: " + b.getOwnerName(), s));
            doc.add(new Paragraph("Address: " + b.getDairyAddress(), s));
            doc.add(new Paragraph("Contact: " + b.getContactNumber(), s));
            doc.add(new Paragraph("Invoice: " + b.getInvoiceNumber(), s));
            doc.add(new Paragraph("Date Range: " + b.getFrom() + " to " + b.getTo(), s));
            doc.add(new Paragraph("Farmer: " + b.getFarmerName() + " (ID: " + b.getFarmerId() + ")", s));
            doc.add(new Paragraph(" ", s));

            PdfPTable t = new PdfPTable(7);
            t.setWidthPercentage(100);
            for (String x : List.of("Date", "Milk Type", "Liters", "Fat", "SNF", "Rate", "Amount")) {
                PdfPCell c = new PdfPCell(new Paragraph(x, s));
                c.setBackgroundColor(new Color(230, 240, 235));
                t.addCell(c);
            }
            for (FarmerBillLineItemResponse r : b.getItems()) {
                t.addCell(new Paragraph(r.getDate().toString(), s));
                t.addCell(new Paragraph(r.getMilkType(), s));
                t.addCell(new Paragraph(r.getLiters().toString(), s));
                t.addCell(new Paragraph(r.getFat().toString(), s));
                t.addCell(new Paragraph(r.getSnf().toString(), s));
                t.addCell(new Paragraph(r.getRate().toString(), s));
               // t.addCell(new Paragraph(r.getAmount().toString(), s));
            }
            doc.add(t);
            doc.add(new Paragraph(" ", s));
            doc.add(new Paragraph("Summary", h));
            doc.add(new Paragraph("Total Milk Quantity: " + b.getTotalMilkQuantity() + " L", s));
            doc.add(new Paragraph("Average Fat: " + b.getAverageFat(), s));
            doc.add(new Paragraph("Average SNF: " + b.getAverageSnf(), s));
            doc.add(new Paragraph("Average Rate: " + b.getAverageRate(), s));
            doc.add(new Paragraph("Total Amount: ₹ " + b.getTotalAmount(), s));
            doc.add(new Paragraph(" ", s));
            doc.add(new Paragraph("Deductions", h));
            doc.add(new Paragraph("Feed Deduction: ₹ " + b.getFeedDeduction(), s));
            doc.add(new Paragraph("Advance Payment: ₹ " + b.getAdvancePayment(), s));
            doc.add(new Paragraph("Loan Amount: ₹ " + b.getLoanAmount(), s));
            doc.add(new Paragraph("Other Deductions: ₹ " + b.getOtherDeductions(), s));
            doc.add(new Paragraph("Final Payable Amount: ₹ " + b.getFinalPayableAmount(), s));
            doc.add(new Paragraph(" ", s));
            doc.add(new Paragraph("Farmer Signature: ____________________", s));
            doc.add(new Paragraph("Dairy Owner Signature: ____________________", s));
            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Farmer bill PDF export failed", e);
        }
    }

    private byte[] excel(FarmerBillResponse b) {
        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Sheet sh = wb.createSheet("Farmer Bill");
            int r = 0;
            sh.createRow(r++).createCell(0).setCellValue(b.getDairyName());
            sh.createRow(r++).createCell(0).setCellValue("Owner: " + b.getOwnerName());
            sh.createRow(r++).createCell(0).setCellValue("Address: " + b.getDairyAddress());
            sh.createRow(r++).createCell(0).setCellValue("Contact: " + b.getContactNumber());
            sh.createRow(r++).createCell(0).setCellValue("Invoice: " + b.getInvoiceNumber());
            sh.createRow(r++).createCell(0).setCellValue("Date Range: " + b.getFrom() + " to " + b.getTo());
            sh.createRow(r++).createCell(0).setCellValue("Farmer: " + b.getFarmerName() + " (ID: " + b.getFarmerId() + ")");
            r++;
            Row h = sh.createRow(r++);
            String[] cols = {"Date", "Milk Type", "Liters", "Fat", "SNF", "Rate", "Amount"};
            for (int i = 0; i < cols.length; i++) h.createCell(i).setCellValue(cols[i]);
            for (FarmerBillLineItemResponse x : b.getItems()) {
                Row row = sh.createRow(r++);
                row.createCell(0).setCellValue(x.getDate().toString());
                row.createCell(1).setCellValue(x.getMilkType());
                row.createCell(2).setCellValue(x.getLiters().doubleValue());
                row.createCell(3).setCellValue(x.getFat().doubleValue());
                row.createCell(4).setCellValue(x.getSnf().doubleValue());
                row.createCell(5).setCellValue(x.getRate().doubleValue());
                row.createCell(6).setCellValue(x.getAmount().doubleValue());
            }
            r++;
            sh.createRow(r++).createCell(0).setCellValue("Total Milk Quantity: " + b.getTotalMilkQuantity());
            sh.createRow(r++).createCell(0).setCellValue("Average Fat: " + b.getAverageFat());
            sh.createRow(r++).createCell(0).setCellValue("Average SNF: " + b.getAverageSnf());
            sh.createRow(r++).createCell(0).setCellValue("Average Rate: " + b.getAverageRate());
            sh.createRow(r++).createCell(0).setCellValue("Total Amount: " + b.getTotalAmount());
            sh.createRow(r++).createCell(0).setCellValue("Feed Deduction: " + b.getFeedDeduction());
            sh.createRow(r++).createCell(0).setCellValue("Advance Payment: " + b.getAdvancePayment());
            sh.createRow(r++).createCell(0).setCellValue("Loan Amount: " + b.getLoanAmount());
            sh.createRow(r++).createCell(0).setCellValue("Other Deductions: " + b.getOtherDeductions());
            sh.createRow(r++).createCell(0).setCellValue("Final Payable Amount: " + b.getFinalPayableAmount());
            sh.createRow(r++).createCell(0).setCellValue("Farmer Signature: ____________________");
            sh.createRow(r++).createCell(0).setCellValue("Dairy Owner Signature: ____________________");
            for (int i = 0; i < 7; i++) sh.autoSizeColumn(i);
            wb.write(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Farmer bill Excel export failed", e);
        }
    }

    private static BigDecimal div(BigDecimal qty, BigDecimal amount) {
        if (qty.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        return amount.divide(qty, 2, RoundingMode.HALF_UP);
    }

    private static BigDecimal n(BigDecimal x) {
        return x == null ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : x.setScale(2, RoundingMode.HALF_UP);
    }

    private static void addLogoIfAny(Document doc, String base64DataUrl) {
        try {
            if (base64DataUrl == null || base64DataUrl.isBlank() || !base64DataUrl.contains(",")) return;
            String b64 = base64DataUrl.substring(base64DataUrl.indexOf(",") + 1);
            byte[] bytes = Base64.getDecoder().decode(b64);
            Image img = Image.getInstance(bytes);
            img.scaleToFit(70, 70);
            doc.add(img);
        } catch (Exception ignored) {
            // keep bill generation resilient even when logo payload is malformed
        }
    }
}

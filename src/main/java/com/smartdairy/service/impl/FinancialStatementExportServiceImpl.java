package com.smartdairy.service.impl;

import com.smartdairy.dto.FinancialStatementDto;
import com.smartdairy.entity.DairyProfile;
import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.FarmerFinancialAccount;
import com.smartdairy.entity.FarmerFinancialTransaction;
import com.smartdairy.entity.User;
import com.smartdairy.exception.ResourceNotFoundException;
import com.smartdairy.repository.DairyProfileRepository;
import com.smartdairy.repository.FarmerFinancialTransactionRepository;
import com.smartdairy.repository.FarmerRepository;
import com.smartdairy.service.FarmerFinancialAccountService;
import com.smartdairy.service.FinancialStatementExportService;
import com.smartdairy.service.UserService;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FinancialStatementExportServiceImpl implements FinancialStatementExportService {

    private final FarmerFinancialTransactionRepository transactionRepository;
    private final FarmerFinancialAccountService financialAccountService;
    private final FarmerRepository farmerRepository;
    private final DairyProfileRepository dairyProfileRepository;
    private final UserService userService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final DateTimeFormatter FILE_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    public FinancialStatementExportServiceImpl(
            FarmerFinancialTransactionRepository transactionRepository,
            FarmerFinancialAccountService financialAccountService,
            FarmerRepository farmerRepository,
            DairyProfileRepository dairyProfileRepository,
            UserService userService) {
        this.transactionRepository = transactionRepository;
        this.financialAccountService = financialAccountService;
        this.farmerRepository = farmerRepository;
        this.dairyProfileRepository = dairyProfileRepository;
        this.userService = userService;
    }

    @Override
    @Transactional(readOnly = true)
    public FinancialStatementDto generateFinancialStatement(Long farmerId, LocalDate from, LocalDate to) {
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("From date must be before or equal to to date");
        }

        User admin = userService.getLoggedInUser();
        Farmer farmer = farmerRepository.findByIdAndAdmin(farmerId, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found with id: " + farmerId));

        DairyProfile dairyProfile = dairyProfileRepository.findByUser_Id(admin.getId())
                .orElse(null);
        String dairyName = dairyProfile != null && dairyProfile.getDairyName() != null 
                ? dairyProfile.getDairyName() : "Smart Dairy";

        FarmerFinancialAccount account = financialAccountService.findAccountOrDefault(farmerId);

        List<FarmerFinancialTransaction> transactions = transactionRepository
                .findByAdminAndFarmerAndDateRange(admin, farmer, from, to);

        BigDecimal totalAdvanceRecovered = transactionRepository
                .sumAdvanceRecoveredByAdminAndFarmerAndDateRange(admin, farmer, from, to);
        if (totalAdvanceRecovered == null) totalAdvanceRecovered = BigDecimal.ZERO;

        BigDecimal totalLoanRecovered = transactionRepository
                .sumLoanRecoveredByAdminAndFarmerAndDateRange(admin, farmer, from, to);
        if (totalLoanRecovered == null) totalLoanRecovered = BigDecimal.ZERO;

        BigDecimal totalOtherRecovered = transactionRepository
                .sumOtherRecoveredByAdminAndFarmerAndDateRange(admin, farmer, from, to);
        if (totalOtherRecovered == null) totalOtherRecovered = BigDecimal.ZERO;

        BigDecimal totalRecovered = totalAdvanceRecovered.add(totalLoanRecovered).add(totalOtherRecovered);

        BigDecimal totalPaymentsReleased = transactionRepository
                .sumPaymentsReleasedByAdminAndFarmerAndDateRange(admin, farmer, from, to);
        if (totalPaymentsReleased == null) totalPaymentsReleased = BigDecimal.ZERO;

        BigDecimal currentPendingAdvance = account.getPendingAdvance();
        BigDecimal currentPendingLoan = account.getPendingLoan();
        BigDecimal currentPendingOther = account.getPendingOther();
        BigDecimal totalPendingBalance = currentPendingAdvance.add(currentPendingLoan).add(currentPendingOther);

        BigDecimal openingBalance = totalPendingBalance.add(totalPaymentsReleased).subtract(totalRecovered);

        BigDecimal netPendingBalance = totalPendingBalance;

        List<FinancialStatementDto.TransactionDetailDto> transactionDetails = transactions.stream()
                .map(t -> FinancialStatementDto.TransactionDetailDto.builder()
                        .transactionDate(t.getTransactionDate())
                        .transactionType(t.getTransactionType().name())
                        .description(t.getDescription())
                        .amount(t.getAmount())
                        .balanceAfter(t.getBalanceAfter())
                        .build())
                .collect(Collectors.toList());

        return FinancialStatementDto.builder()
                .farmerId(farmer.getId())
                .farmerName(farmer.getFullName())
                .dairyName(dairyName)
                .statementFromDate(from)
                .statementToDate(to)
                .generatedDate(LocalDate.now())
                .openingBalance(openingBalance.setScale(2, RoundingMode.HALF_UP))
                .currentPendingAdvance(currentPendingAdvance.setScale(2, RoundingMode.HALF_UP))
                .currentPendingLoan(currentPendingLoan.setScale(2, RoundingMode.HALF_UP))
                .currentPendingOther(currentPendingOther.setScale(2, RoundingMode.HALF_UP))
                .totalAdvanceRecovered(totalAdvanceRecovered.setScale(2, RoundingMode.HALF_UP))
                .totalLoanRecovered(totalLoanRecovered.setScale(2, RoundingMode.HALF_UP))
                .totalOtherRecovered(totalOtherRecovered.setScale(2, RoundingMode.HALF_UP))
                .totalRecovered(totalRecovered.setScale(2, RoundingMode.HALF_UP))
                .totalPaymentsReleased(totalPaymentsReleased.setScale(2, RoundingMode.HALF_UP))
                .netPendingBalance(netPendingBalance.setScale(2, RoundingMode.HALF_UP))
                .transactions(transactionDetails)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> exportToPdf(Long farmerId, LocalDate from, LocalDate to) {
        FinancialStatementDto statement = generateFinancialStatement(farmerId, from, to);

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, outputStream);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);

            Paragraph title = new Paragraph("Financial Statement", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(Chunk.NEWLINE);

            Paragraph dairyName = new Paragraph(statement.getDairyName(), headerFont);
            dairyName.setAlignment(Element.ALIGN_CENTER);
            document.add(dairyName);
            document.add(Chunk.NEWLINE);

            PdfPTable farmerInfoTable = new PdfPTable(2);
            farmerInfoTable.setWidthPercentage(100);
            farmerInfoTable.addCell(createCell("Farmer Name:", boldFont));
            farmerInfoTable.addCell(createCell(statement.getFarmerName(), normalFont));
            farmerInfoTable.addCell(createCell("Farmer ID:", boldFont));
            farmerInfoTable.addCell(createCell(String.valueOf(statement.getFarmerId()), normalFont));
            farmerInfoTable.addCell(createCell("Statement Period:", boldFont));
            farmerInfoTable.addCell(createCell(
                    from.format(DATE_FORMATTER) + " to " + to.format(DATE_FORMATTER), normalFont));
            farmerInfoTable.addCell(createCell("Generated Date:", boldFont));
            farmerInfoTable.addCell(createCell(statement.getGeneratedDate().format(DATE_FORMATTER), normalFont));
            document.add(farmerInfoTable);
            document.add(Chunk.NEWLINE);

            Paragraph summaryTitle = new Paragraph("Financial Summary", headerFont);
            document.add(summaryTitle);
            document.add(Chunk.NEWLINE);

            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(100);
            summaryTable.addCell(createCell("Opening Balance:", boldFont));
            summaryTable.addCell(createCurrencyCell(formatCurrency(statement.getOpeningBalance()), normalFont));
            summaryTable.addCell(createCell("Current Pending Advance:", boldFont));
            summaryTable.addCell(createCurrencyCell(formatCurrency(statement.getCurrentPendingAdvance()), normalFont));
            summaryTable.addCell(createCell("Current Pending Loan:", boldFont));
            summaryTable.addCell(createCurrencyCell(formatCurrency(statement.getCurrentPendingLoan()), normalFont));
            summaryTable.addCell(createCell("Current Pending Other:", boldFont));
            summaryTable.addCell(createCurrencyCell(formatCurrency(statement.getCurrentPendingOther()), normalFont));
            summaryTable.addCell(createCell("Total Recoveries:", boldFont));
            summaryTable.addCell(createCurrencyCell(formatCurrency(statement.getTotalRecovered()), normalFont));
            summaryTable.addCell(createCell("Total Payments Released:", boldFont));
            summaryTable.addCell(createCurrencyCell(formatCurrency(statement.getTotalPaymentsReleased()), normalFont));
            summaryTable.addCell(createCell("Net Pending Balance:", boldFont));
            summaryTable.addCell(createCurrencyCell(formatCurrency(statement.getNetPendingBalance()), boldFont));
            document.add(summaryTable);
            document.add(Chunk.NEWLINE);

            Paragraph transactionsTitle = new Paragraph("Transaction History", headerFont);
            document.add(transactionsTitle);
            document.add(Chunk.NEWLINE);

            PdfPTable transactionTable = new PdfPTable(5);
            transactionTable.setWidthPercentage(100);
            transactionTable.setWidths(new float[]{2, 3, 3, 2, 2});
            transactionTable.addCell(createHeaderCell("Date"));
            transactionTable.addCell(createHeaderCell("Type"));
            transactionTable.addCell(createHeaderCell("Description"));
            transactionTable.addCell(createHeaderCell("Amount"));
            transactionTable.addCell(createHeaderCell("Balance After"));

            for (FinancialStatementDto.TransactionDetailDto tx : statement.getTransactions()) {
                transactionTable.addCell(createCell(tx.getTransactionDate().format(DATE_FORMATTER), normalFont));
                transactionTable.addCell(createCell(tx.getTransactionType(), normalFont));
                transactionTable.addCell(createCell(tx.getDescription() != null ? tx.getDescription() : "-", normalFont));
                transactionTable.addCell(createCurrencyCell(formatCurrency(tx.getAmount()), normalFont));
                transactionTable.addCell(createCurrencyCell(formatCurrency(tx.getBalanceAfter()), normalFont));
            }

            if (statement.getTransactions().isEmpty()) {
                PdfPCell emptyCell = new PdfPCell(new Phrase("No transactions in this period", normalFont));
                emptyCell.setColspan(5);
                emptyCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                emptyCell.setBorder(Rectangle.NO_BORDER);
                emptyCell.setPadding(10);
                transactionTable.addCell(emptyCell);
            }

            document.add(transactionTable);

            document.close();

            String filename = "financial_statement_" + statement.getFarmerId() + "_" + 
                            to.format(FILE_DATE_FORMATTER) + ".pdf";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", filename);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(outputStream.toByteArray());

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF statement", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> exportToExcel(Long farmerId, LocalDate from, LocalDate to) {
        FinancialStatementDto statement = generateFinancialStatement(farmerId, from, to);

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            CellStyle labelStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font labelFont = workbook.createFont();
            labelFont.setBold(true);
            labelStyle.setFont(labelFont);

            CellStyle currencyStyle = workbook.createCellStyle();
            currencyStyle.setDataFormat((short) 8);

            Sheet summarySheet = workbook.createSheet("Summary");
            summarySheet.setColumnWidth(0, 6000);
            summarySheet.setColumnWidth(1, 6000);

            int rowIdx = 0;
            Row titleRow = summarySheet.createRow(rowIdx++);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Financial Statement");
            titleCell.setCellStyle(headerStyle);
            summarySheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, 1));

            rowIdx++;
            summarySheet.createRow(rowIdx++);

            addSummaryRow(summarySheet, rowIdx++, "Dairy Name", statement.getDairyName(), labelStyle);
            addSummaryRow(summarySheet, rowIdx++, "Farmer Name", statement.getFarmerName(), labelStyle);
            addSummaryRow(summarySheet, rowIdx++, "Farmer ID", String.valueOf(statement.getFarmerId()), labelStyle);
            addSummaryRow(summarySheet, rowIdx++, "Statement Period", 
                    from.format(DATE_FORMATTER) + " to " + to.format(DATE_FORMATTER), labelStyle);
            addSummaryRow(summarySheet, rowIdx++, "Generated Date", statement.getGeneratedDate().format(DATE_FORMATTER), labelStyle);

            rowIdx++;
            Row summaryHeaderRow = summarySheet.createRow(rowIdx++);
            Cell summaryHeaderCell = summaryHeaderRow.createCell(0);
            summaryHeaderCell.setCellValue("Financial Summary");
            summaryHeaderCell.setCellStyle(headerStyle);
            summarySheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 1));

            rowIdx++;
            addSummaryRow(summarySheet, rowIdx++, "Opening Balance", statement.getOpeningBalance().doubleValue(), labelStyle, currencyStyle);
            addSummaryRow(summarySheet, rowIdx++, "Current Pending Advance", statement.getCurrentPendingAdvance().doubleValue(), labelStyle, currencyStyle);
            addSummaryRow(summarySheet, rowIdx++, "Current Pending Loan", statement.getCurrentPendingLoan().doubleValue(), labelStyle, currencyStyle);
            addSummaryRow(summarySheet, rowIdx++, "Current Pending Other", statement.getCurrentPendingOther().doubleValue(), labelStyle, currencyStyle);
            addSummaryRow(summarySheet, rowIdx++, "Total Recoveries", statement.getTotalRecovered().doubleValue(), labelStyle, currencyStyle);
            addSummaryRow(summarySheet, rowIdx++, "Total Payments Released", statement.getTotalPaymentsReleased().doubleValue(), labelStyle, currencyStyle);
            addSummaryRow(summarySheet, rowIdx++, "Net Pending Balance", statement.getNetPendingBalance().doubleValue(), labelStyle, currencyStyle);

            Sheet transactionSheet = workbook.createSheet("Transactions");
            transactionSheet.setColumnWidth(0, 4000);
            transactionSheet.setColumnWidth(1, 5000);
            transactionSheet.setColumnWidth(2, 6000);
            transactionSheet.setColumnWidth(3, 4000);
            transactionSheet.setColumnWidth(4, 4000);

            Row txHeaderRow = transactionSheet.createRow(0);
            String[] txHeaders = {"Date", "Type", "Description", "Amount", "Balance After"};
            for (int i = 0; i < txHeaders.length; i++) {
                Cell cell = txHeaderRow.createCell(i);
                cell.setCellValue(txHeaders[i]);
                cell.setCellStyle(headerStyle);
            }

            int txRowIdx = 1;
            for (FinancialStatementDto.TransactionDetailDto tx : statement.getTransactions()) {
                Row txRow = transactionSheet.createRow(txRowIdx++);
                txRow.createCell(0).setCellValue(tx.getTransactionDate().format(DATE_FORMATTER));
                txRow.createCell(1).setCellValue(tx.getTransactionType());
                txRow.createCell(2).setCellValue(tx.getDescription() != null ? tx.getDescription() : "");
                Cell amountCell = txRow.createCell(3);
                amountCell.setCellValue(tx.getAmount().doubleValue());
                amountCell.setCellStyle(currencyStyle);
                Cell balanceCell = txRow.createCell(4);
                balanceCell.setCellValue(tx.getBalanceAfter().doubleValue());
                balanceCell.setCellStyle(currencyStyle);
            }

            if (statement.getTransactions().isEmpty()) {
                Row emptyRow = transactionSheet.createRow(txRowIdx);
                Cell emptyCell = emptyRow.createCell(0);
                emptyCell.setCellValue("No transactions in this period");
                emptyCell.setCellStyle(labelStyle);
                transactionSheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(txRowIdx, txRowIdx, 0, 4));
            }

            for (int i = 0; i < 5; i++) {
                transactionSheet.autoSizeColumn(i);
            }

            workbook.write(outputStream);

            String filename = "financial_statement_" + statement.getFarmerId() + "_" + 
                            to.format(FILE_DATE_FORMATTER) + ".xlsx";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", filename);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(outputStream.toByteArray());

        } catch (IOException e) {
            throw new RuntimeException("Failed to generate Excel statement", e);
        }
    }

    private PdfPCell createCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(5);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        return cell;
    }

    private PdfPCell createHeaderCell(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
        cell.setBackgroundColor(new Color(230, 230, 230));
        cell.setPadding(5);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        return cell;
    }

    private PdfPCell createCurrencyCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(5);
        cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        return cell;
    }

    private void addSummaryRow(Sheet sheet, int rowIdx, String label, String value, CellStyle labelStyle) {
        Row row = sheet.createRow(rowIdx);
        Cell labelCell = row.createCell(0);
        labelCell.setCellValue(label);
        labelCell.setCellStyle(labelStyle);
        row.createCell(1).setCellValue(value);
    }

    private void addSummaryRow(Sheet sheet, int rowIdx, String label, double value, CellStyle labelStyle, CellStyle currencyStyle) {
        Row row = sheet.createRow(rowIdx);
        Cell labelCell = row.createCell(0);
        labelCell.setCellValue(label);
        labelCell.setCellStyle(labelStyle);
        Cell valueCell = row.createCell(1);
        valueCell.setCellValue(value);
        valueCell.setCellStyle(currencyStyle);
    }

    private String formatCurrency(BigDecimal value) {
        return "₹" + value.setScale(2, RoundingMode.HALF_UP).toString();
    }
}

package com.smartdairy.service.impl;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.smartdairy.dto.DairyProfileResponse;
import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.MilkCollection;
import com.smartdairy.entity.User;
import com.smartdairy.exception.ResourceNotFoundException;
import com.smartdairy.repository.FarmerRepository;
import com.smartdairy.repository.FeedPurchaseRepository;
import com.smartdairy.repository.MilkCollectionRepository;
import com.smartdairy.service.ReportExportService;
import com.smartdairy.service.UserService;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.YearMonth;
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
public class ReportExportServiceImpl implements ReportExportService {

    private enum ExportFormat {
        PDF,
        XLSX
    }

    private final MilkCollectionRepository milkCollectionRepository;
    private final FarmerRepository farmerRepository;
    private final FeedPurchaseRepository feedPurchaseRepository;
    private final com.smartdairy.service.DairyProfileService dairyProfileService;
    private final UserService userService;

    @Override
    @Transactional(readOnly = true)
    public byte[] exportDailyMilk(LocalDate date, String format) {
        User admin = userService.getLoggedInUser();
        List<MilkCollection> rows = milkCollectionRepository.findByAdminAndDateWithFarmerOrdered(admin, date);
        ExportFormat f = parseFormat(format);
        String title = "Daily Milk Collection — " + date;
        if (f == ExportFormat.PDF) {
            return buildPdfDetail(title, rows, false);
        }
        return buildExcelDetail(title, rows, false);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportWeeklyMilk(LocalDate from, LocalDate to, String format) {
        User admin = userService.getLoggedInUser();
        List<MilkCollection> rows =
                milkCollectionRepository.findByAdminAndDateBetweenOrderByDateAscFarmer_FullNameAsc(admin, from, to);
        ExportFormat f = parseFormat(format);
        String title = "Weekly Milk Collection — " + from + " to " + to;
        java.math.BigDecimal feedDeduction = feedPurchaseRepository.sumTotalAmountBetweenForAdmin(admin, from, to);
        if (f == ExportFormat.PDF) {
            return buildPdfDetail(title + " | Feed deduction ₹ " + feedDeduction, rows, true);
        }
        return buildExcelDetail(title + " | Feed deduction ₹ " + feedDeduction, rows, true);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportMonthlyMilk(int year, int month, String format) {
        YearMonth ym = YearMonth.of(year, month);
        LocalDate from = ym.atDay(1);
        LocalDate to = ym.atEndOfMonth();
        return exportWeeklyMilk(from, to, format);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportFarmerMilk(Long farmerId, LocalDate from, LocalDate to, String format) {
        User admin = userService.getLoggedInUser();
        Farmer farmer = farmerRepository.findByIdAndAdmin(farmerId, admin)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer not found"));
        List<MilkCollection> rows =
                milkCollectionRepository.findByAdminAndFarmer_IdAndDateBetweenOrderByDateAsc(admin, farmerId, from, to);
        ExportFormat f = parseFormat(format);
        String title = "Farmer Milk Report — " + farmer.getFullName() + " (" + from + " to " + to + ")";
        java.math.BigDecimal feedDeduction =
                feedPurchaseRepository.sumTotalAmountBetweenForAdminAndFarmer(admin, from, to, farmerId);
        if (f == ExportFormat.PDF) {
            return buildPdfDetail(title + " | Feed deduction ₹ " + feedDeduction, rows, true);
        }
        return buildExcelDetail(title + " | Feed deduction ₹ " + feedDeduction, rows, true);
    }

    private static ExportFormat parseFormat(String format) {
        if (format == null || format.isBlank() || format.equalsIgnoreCase("pdf")) {
            return ExportFormat.PDF;
        }
        if (format.equalsIgnoreCase("xlsx") || format.equalsIgnoreCase("excel")) {
            return ExportFormat.XLSX;
        }
        throw new IllegalArgumentException("Unsupported format. Use pdf or xlsx.");
    }

    private byte[] buildPdfDetail(String title, List<MilkCollection> rows, boolean includeDateColumn) {
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
            document.add(new Paragraph(" ", small));

            int cols = includeDateColumn ? 8 : 7;
            PdfPTable table = new PdfPTable(cols);
            table.setWidthPercentage(100);
            if (includeDateColumn) {
                addHeaderCell(table, "Date", small);
            }
            addHeaderCell(table, "Farmer", small);
            addHeaderCell(table, "Shift", small);
            addHeaderCell(table, "Qty (L)", small);
            addHeaderCell(table, "Fat %", small);
            addHeaderCell(table, "SNF %", small);
            addHeaderCell(table, "Rate", small);
            addHeaderCell(table, "Amount", small);

            for (MilkCollection m : rows) {
                if (includeDateColumn) {
                    table.addCell(new PdfPCell(new Paragraph(m.getDate().toString(), small)));
                }
                table.addCell(new PdfPCell(new Paragraph(m.getFarmer().getFullName(), small)));
                table.addCell(new PdfPCell(new Paragraph(m.getShift().name(), small)));
                table.addCell(new PdfPCell(new Paragraph(m.getQuantityLiters().toString(), small)));
                table.addCell(new PdfPCell(new Paragraph(m.getFatPercentage().toString(), small)));
                table.addCell(new PdfPCell(new Paragraph(m.getSnfPercentage().toString(), small)));
                table.addCell(new PdfPCell(new Paragraph(m.getRatePerLiter().toString(), small)));
                table.addCell(new PdfPCell(new Paragraph(m.getTotalAmount().toString(), small)));
            }

            if (rows.isEmpty()) {
                PdfPCell empty = new PdfPCell(new Paragraph("No records.", small));
                empty.setColspan(cols);
                table.addCell(empty);
            }

            document.add(table);
            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("PDF export failed", e);
        }
    }

    private void addHeaderCell(PdfPTable table, String text, Font font) {
        PdfPCell c = new PdfPCell(new Paragraph(text, font));
        c.setBackgroundColor(new Color(230, 240, 235));
        table.addCell(c);
    }

    private byte[] buildExcelDetail(String title, List<MilkCollection> rows, boolean includeDateColumn) {
        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Report");
            int r = 0;
            Row titleRow = sheet.createRow(r++);
            titleRow.createCell(0).setCellValue(title);
            DairyProfileResponse dairy = dairyProfileService.getCurrentUserProfile();
            r++;
            Row dairyRow = sheet.createRow(r++);
            dairyRow.createCell(0).setCellValue(
                    dairy.getDairyName() + " | Owner: " + dairy.getOwnerName() + " | Contact: " + dairy.getContactNumber());

            Row header = sheet.createRow(r++);
            int c = 0;
            if (includeDateColumn) {
                header.createCell(c++).setCellValue("Date");
            }
            header.createCell(c++).setCellValue("Farmer");
            header.createCell(c++).setCellValue("Shift");
            header.createCell(c++).setCellValue("Qty (L)");
            header.createCell(c++).setCellValue("Fat %");
            header.createCell(c++).setCellValue("SNF %");
            header.createCell(c++).setCellValue("Rate");
            header.createCell(c++).setCellValue("Amount");

            for (MilkCollection m : rows) {
                Row row = sheet.createRow(r++);
                c = 0;
                if (includeDateColumn) {
                    row.createCell(c++).setCellValue(m.getDate().toString());
                }
                row.createCell(c++).setCellValue(m.getFarmer().getFullName());
                row.createCell(c++).setCellValue(m.getShift().name());
                row.createCell(c++).setCellValue(m.getQuantityLiters().doubleValue());
                row.createCell(c++).setCellValue(m.getFatPercentage().doubleValue());
                row.createCell(c++).setCellValue(m.getSnfPercentage().doubleValue());
                row.createCell(c++).setCellValue(m.getRatePerLiter().doubleValue());
                row.createCell(c++).setCellValue(m.getTotalAmount().doubleValue());
            }

            if (rows.isEmpty()) {
                Row row = sheet.createRow(r);
                row.createCell(0).setCellValue("No records.");
            }

            int colCount = includeDateColumn ? 8 : 7;
            for (int i = 0; i < colCount; i++) {
                sheet.autoSizeColumn(i);
            }

            wb.write(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Excel export failed", e);
        }
    }
}

package com.smartdairy.service;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import com.smartdairy.dto.DairyProfileResponse;
import com.smartdairy.entity.Payment;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PaymentReceiptPdfService {

    private final DairyProfileService dairyProfileService;

    public byte[] buildReceipt(Payment payment) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document document = new Document();
            PdfWriter.getInstance(document, baos);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.DARK_GRAY);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 11, Color.BLACK);

            DairyProfileResponse dairy = dairyProfileService.getCurrentUserProfile();
            document.add(new Paragraph(dairy.getDairyName() + " — Payment Receipt", titleFont));
            document.add(new Paragraph("Owner: " + dairy.getOwnerName() + " | Contact: " + dairy.getContactNumber(), bodyFont));
            document.add(new Paragraph("Address: " + dairy.getDairyAddress(), bodyFont));
            document.add(new Paragraph(" ", bodyFont));
            document.add(new Paragraph("Payment ID: " + payment.getId(), bodyFont));
            document.add(new Paragraph("Farmer: " + payment.getFarmer().getFullName() + " (ID: " + payment.getFarmer().getId() + ")", bodyFont));
            document.add(new Paragraph("Milk Collection ID: " + payment.getMilkCollection().getId(), bodyFont));
            document.add(new Paragraph("Gross Amount: ₹ " + payment.getGrossAmount(), bodyFont));
            document.add(new Paragraph("Feed Deduction: ₹ " + payment.getFeedDeductionAmount(), bodyFont));
            document.add(new Paragraph("Net Payable Amount: ₹ " + payment.getAmount(), bodyFont));
            document.add(new Paragraph("Status: " + payment.getStatus(), bodyFont));
            if (payment.getPaymentDate() != null) {
                document.add(new Paragraph("Payment Date: " + payment.getPaymentDate(), bodyFont));
            }
            if (payment.getPaymentMethod() != null) {
                document.add(new Paragraph("Payment Method: " + payment.getPaymentMethod(), bodyFont));
            }
            if (payment.getRemarks() != null && !payment.getRemarks().isBlank()) {
                document.add(new Paragraph("Remarks: " + payment.getRemarks(), bodyFont));
            }
            document.add(new Paragraph(" ", bodyFont));
            document.add(new Paragraph("Generated on: " + java.time.LocalDate.now(), bodyFont));
            document.add(new Paragraph("SMS Footer: " + dairy.getSmsFooter(), bodyFont));

            document.close();
            return baos.toByteArray();
        } catch (DocumentException e) {
            throw new IllegalStateException("Failed to generate PDF receipt", e);
        }
    }
}

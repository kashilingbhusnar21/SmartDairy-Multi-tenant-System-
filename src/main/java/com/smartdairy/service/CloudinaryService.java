package com.smartdairy.service;

public interface CloudinaryService {

    String uploadFile(byte[] fileBytes, String fileName, String folder);

    String uploadPdf(byte[] pdfBytes, String prefix, String folder);
}

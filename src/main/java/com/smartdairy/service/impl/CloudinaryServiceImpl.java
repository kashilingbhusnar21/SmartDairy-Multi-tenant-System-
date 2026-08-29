package com.smartdairy.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.smartdairy.exception.CloudinaryUploadException;
import com.smartdairy.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryServiceImpl implements CloudinaryService {

    private final Cloudinary cloudinary;

    @Override
    public String uploadFile(byte[] fileBytes, String fileName, String folder) {
        try {
            log.info("Uploading file: {} ({} bytes)", fileName, fileBytes.length);

            // Validate file
            if (fileBytes == null || fileBytes.length < 100) {
                throw new IllegalArgumentException("Invalid PDF file (empty or too small)");
            }

            String sanitizedFileName = sanitizeFileName(fileName);

            Map uploadParams = ObjectUtils.asMap(
                "resource_type", "raw",
                "folder", folder,
                "public_id", sanitizedFileName,
                "overwrite", true,
                "content_type", "application/pdf",
                "format", "pdf"
            );

            Map uploadResult = cloudinary.uploader().upload(fileBytes, uploadParams);

            String secureUrl = (String) uploadResult.get("secure_url");

            log.info("Upload success URL: {}", secureUrl);
            log.info("Cloudinary full response: {}", uploadResult);

            return secureUrl;

        } catch (Exception e) {
            log.error("Upload failed: {}", e.getMessage(), e);
            throw new CloudinaryUploadException("PDF upload failed", e);
        }
    }

    @Override
    public String uploadPdf(byte[] pdfBytes, String prefix, String folder) {
        log.info("PDF size before upload: {} bytes", pdfBytes.length);
        String fileName = prefix + "_" + System.currentTimeMillis();
        return uploadFile(pdfBytes, fileName, folder);
    }
    
    private String sanitizeFileName(String fileName) {
        return fileName.replaceAll("[^a-zA-Z0-9-_]", "_");
    }
}

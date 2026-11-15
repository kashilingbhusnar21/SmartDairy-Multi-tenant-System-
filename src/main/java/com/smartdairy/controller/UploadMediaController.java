package com.smartdairy.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UploadMediaController {

    @Value("${equipment.upload.dir:uploads/equipment}")
    private String uploadDir;

    @GetMapping("/uploads/equipment/{filename:.+}")
    public ResponseEntity<Resource> getEquipmentImage(@PathVariable String filename) {
        try {
            // Guard against directory traversal attacks
            if (filename == null || filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
                return ResponseEntity.badRequest().build();
            }

            Path filePath = Paths.get(uploadDir).resolve(filename).normalize();
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }

            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            MediaType mediaType = MediaTypeFactory.getMediaType(resource)
                    .orElse(MediaType.APPLICATION_OCTET_STREAM);

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=86400, public")
                    .body(resource);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}

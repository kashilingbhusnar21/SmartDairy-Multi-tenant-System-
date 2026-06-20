package com.smartdairy.service.impl;

import com.smartdairy.dto.DairyProfileRequest;
import com.smartdairy.dto.DairyProfileResponse;
import com.smartdairy.entity.DairyProfile;
import com.smartdairy.entity.User;
import com.smartdairy.exception.ResourceNotFoundException;
import com.smartdairy.repository.DairyProfileRepository;
import com.smartdairy.repository.UserRepository;
import com.smartdairy.service.DairyProfileService;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DairyProfileServiceImpl implements DairyProfileService {

    private final DairyProfileRepository dairyProfileRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public DairyProfileResponse getCurrentUserProfile() {
        User user = currentUser();
        DairyProfile p = dairyProfileRepository.findByUser_Id(user.getId()).orElse(null);
        return toResponse(p, user.getEmail());
    }

    @Override
    @Transactional
    public DairyProfileResponse upsertCurrentAdminProfile(DairyProfileRequest request) {
        User user = currentUser();
        DairyProfile p = dairyProfileRepository.findByUser_Id(user.getId()).orElseGet(() -> DairyProfile.builder()
                .user(user)
                .build());
        p.setDairyName(trim(request.getDairyName()));
        p.setOwnerName(trim(request.getOwnerName()));
        p.setContactNumber(trim(request.getContactNumber()));
        p.setEmail(trim(request.getEmail()));
        p.setDairyAddress(trim(request.getDairyAddress()));
        p.setDairyLogo(trim(request.getDairyLogo()));
        p.setUpdatedAt(Instant.now());
        dairyProfileRepository.save(p);
        return toResponse(p, user.getEmail());
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private static DairyProfileResponse toResponse(DairyProfile p, String accountEmail) {
        String dairyName = p != null && notBlank(p.getDairyName()) ? p.getDairyName() : "My Dairy";
        String owner = p != null && notBlank(p.getOwnerName()) ? p.getOwnerName() : "Owner Name";
        String contact = p != null && notBlank(p.getContactNumber()) ? p.getContactNumber() : "NA";
        String email = p != null && notBlank(p.getEmail()) ? p.getEmail() : accountEmail;
        String address = p != null && notBlank(p.getDairyAddress()) ? p.getDairyAddress() : "Address not set";
        String logo = p != null ? p.getDairyLogo() : null;
        String smsFooter = " - " + dairyName + " (" + contact + ")";
        return DairyProfileResponse.builder()
                .id(p != null ? p.getId() : null)
                .dairyName(dairyName)
                .ownerName(owner)
                .contactNumber(contact)
                .email(email)
                .dairyAddress(address)
                .dairyLogo(logo)
                .smsFooter(smsFooter)
                .build();
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    private static String trim(String s) {
        return s == null ? null : s.trim();
    }
}

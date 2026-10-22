package com.smartdairy.service.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.smartdairy.dto.FarmerRequest;
import com.smartdairy.dto.FarmerResponse;
import com.smartdairy.entity.Farmer;
import com.smartdairy.entity.User;
import com.smartdairy.exception.ResourceNotFoundException;
import com.smartdairy.repository.FarmerRepository;
import com.smartdairy.service.UserService;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class FarmerServiceImplTest {

    @Mock
    private FarmerRepository farmerRepository;

    @Mock
    private SmsService smsService;

    @Mock
    private UserService userService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private FarmerServiceImpl farmerService;

    private User testAdmin;
    private Farmer testFarmer;
    private FarmerRequest validRequest;

    @BeforeEach
    void setUp() {
        testAdmin = User.builder().id(1L).email("admin@dairy.com").build();

        testFarmer = Farmer.builder()
                .id(10L)
                .admin(testAdmin)
                .fullName("Suresh Sharma")
                .mobileNumber("9876543210")
                .village("Kalyanpur")
                .aadhaarNumber("123412341234")
                .bankAccountNumber("SBIN123456")
                .ifscCode("SBIN0001234")
                .active(true)
                .build();

        validRequest = new FarmerRequest();
        validRequest.setFullName("Suresh Sharma");
        validRequest.setMobileNumber("9876543210");
        validRequest.setVillage("Kalyanpur");
        validRequest.setAadhaarNumber("123412341234");
        validRequest.setBankAccountNumber("SBIN123456");
        validRequest.setIfscCode("SBIN0001234");
    }

    @Test
    @DisplayName("createFarmer: Successfully registers farmer, assigns admin ID, and sets active=true")
    void createFarmer_Success_AssignsAdminAndSaves() {
        when(userService.getLoggedInUser()).thenReturn(testAdmin);
        when(farmerRepository.save(any(Farmer.class))).thenAnswer(invocation -> {
            Farmer f = invocation.getArgument(0);
            f.setId(10L);
            return f;
        });

        FarmerResponse response = farmerService.createFarmer(validRequest);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals("Suresh Sharma", response.getFullName());
        assertTrue(response.getActive());
        verify(farmerRepository, times(1)).save(any(Farmer.class));
    }

    @Test
    @DisplayName("getFarmerById: Returns farmer details when owned by logged-in admin")
    void getFarmerById_WhenExistsForAdmin_ReturnsResponse() {
        when(userService.getLoggedInUser()).thenReturn(testAdmin);
        when(farmerRepository.findByIdAndAdmin(10L, testAdmin)).thenReturn(Optional.of(testFarmer));

        FarmerResponse response = farmerService.getFarmerById(10L);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals("Suresh Sharma", response.getFullName());
        assertEquals("Kalyanpur", response.getVillage());
    }

    @Test
    @DisplayName("deleteFarmer: Successfully deletes farmer when owned by logged-in admin")
    void deleteFarmer_Success_DeletesEntity() {
        when(userService.getLoggedInUser()).thenReturn(testAdmin);
        when(farmerRepository.findByIdAndAdmin(10L, testAdmin)).thenReturn(Optional.of(testFarmer));

        farmerService.deleteFarmer(10L);

        verify(farmerRepository, times(1)).delete(testFarmer);
    }
}

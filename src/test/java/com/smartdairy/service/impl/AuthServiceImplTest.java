package com.smartdairy.service.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.smartdairy.dto.AuthResponse;
import com.smartdairy.dto.LoginRequest;
import com.smartdairy.entity.Role;
import com.smartdairy.entity.User;
import com.smartdairy.repository.PricingSettingsRepository;
import com.smartdairy.repository.RoleRepository;
import com.smartdairy.repository.UserRepository;
import com.smartdairy.security.JwtService;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PricingSettingsRepository pricingSettingsRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthServiceImpl authService;

    private User testUser;
    private LoginRequest validLoginRequest;

    @BeforeEach
    void setUp() {
        Role adminRole = Role.builder().id(1L).name("ADMIN").build();

        testUser = User.builder()
                .id(1L)
                .email("admin@smartdairy.com")
                .password("encodedSecret")
                .role(adminRole)
                .build();

        validLoginRequest = new LoginRequest();
        validLoginRequest.setEmail("admin@smartdairy.com");
        validLoginRequest.setPassword("Secret@123");
    }

    @Test
    @DisplayName("login: Valid credentials returns AuthResponse containing JWT token and role")
    void login_ValidCredentials_ReturnsAuthResponseWithJwtToken() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(null);
        when(userRepository.findByEmail("admin@smartdairy.com")).thenReturn(Optional.of(testUser));
        when(jwtService.generateToken(testUser)).thenReturn("sample.jwt.token");

        AuthResponse response = authService.login(validLoginRequest);

        assertNotNull(response);
        assertEquals("sample.jwt.token", response.getToken());
        assertEquals("admin@smartdairy.com", response.getEmail());
        assertEquals("ADMIN", response.getRole());
        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    @DisplayName("login: Bad credentials throws BadCredentialsException and generates no token")
    void login_InvalidCredentials_ThrowsBadCredentialsException() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThrows(BadCredentialsException.class, () ->
                authService.login(validLoginRequest)
        );

        verify(jwtService, never()).generateToken(any());
    }
}

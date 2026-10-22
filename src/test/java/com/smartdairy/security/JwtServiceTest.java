package com.smartdairy.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    // 51-byte Base64-encoded secret matching the application configuration
    private static final String TEST_SECRET = "MySuperStrongJWTSecretKeyForSmartDairyApplication2026SecureKey123456";
    private static final long EXPIRATION_MS = 86_400_000L; // 24 hours

    private JwtService jwtService;
    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret", TEST_SECRET);
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", EXPIRATION_MS);

        userDetails = User.builder()
                .username("admin@smartdairy.com")
                .password("encoded_pass")
                .authorities(Collections.emptyList())
                .build();
    }

    @Test
    @DisplayName("generateToken should produce a valid non-empty 3-part JWT token")
    void generateToken_ValidUserDetails_GeneratesValidToken() {
        String token = jwtService.generateToken(userDetails);

        assertThat(token).isNotBlank();
        String[] parts = token.split("\\.");
        assertThat(parts).hasSize(3); // header, payload, signature
    }

    @Test
    @DisplayName("extractUsername should extract subject matching UserDetails username")
    void extractUsername_ValidToken_ReturnsSubject() {
        String token = jwtService.generateToken(userDetails);

        String username = jwtService.extractUsername(token);

        assertThat(username).isEqualTo("admin@smartdairy.com");
    }

    @Test
    @DisplayName("isTokenValid should return true for unexpired token and matching UserDetails")
    void isTokenValid_MatchingUserAndUnexpired_ReturnsTrue() {
        String token = jwtService.generateToken(userDetails);

        boolean isValid = jwtService.isTokenValid(token, userDetails);

        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("isTokenValid should return false when UserDetails username does not match token subject")
    void isTokenValid_UsernameMismatch_ReturnsFalse() {
        String token = jwtService.generateToken(userDetails);

        UserDetails differentUser = User.builder()
                .username("other@smartdairy.com")
                .password("encoded_pass")
                .authorities(Collections.emptyList())
                .build();

        boolean isValid = jwtService.isTokenValid(token, differentUser);

        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("generateToken with extra claims should embed and allow extraction of custom claims")
    void generateToken_WithExtraClaims_IncludesClaimsInToken() {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", "FARMER");
        extraClaims.put("farmerId", 42L);
        extraClaims.put("adminId", 1L);

        String token = jwtService.generateToken(extraClaims, userDetails);

        String role = jwtService.extractClaim(token, claims -> claims.get("role", String.class));
        Number farmerId = jwtService.extractClaim(token, claims -> claims.get("farmerId", Number.class));
        Number adminId = jwtService.extractClaim(token, claims -> claims.get("adminId", Number.class));

        assertThat(role).isEqualTo("FARMER");
        assertThat(farmerId.longValue()).isEqualTo(42L);
        assertThat(adminId.longValue()).isEqualTo(1L);
    }

    @Test
    @DisplayName("parsing an expired token should throw ExpiredJwtException")
    void parseToken_WhenTokenIsExpired_ThrowsExpiredJwtException() {
        JwtService expiredJwtService = new JwtService();
        ReflectionTestUtils.setField(expiredJwtService, "jwtSecret", TEST_SECRET);
        ReflectionTestUtils.setField(expiredJwtService, "jwtExpirationMs", -10_000L); // Expired in the past

        String expiredToken = expiredJwtService.generateToken(userDetails);

        assertThatThrownBy(() -> jwtService.extractUsername(expiredToken))
                .isInstanceOf(ExpiredJwtException.class);
    }

    @Test
    @DisplayName("parsing a tampered token should throw JwtException")
    void parseToken_WhenSignatureTampered_ThrowsJwtException() {
        String token = jwtService.generateToken(userDetails);
        String tamperedToken = token.substring(0, token.lastIndexOf('.') + 1) + "invalidsignature";

        assertThatThrownBy(() -> jwtService.extractUsername(tamperedToken))
                .isInstanceOf(JwtException.class);
    }
}

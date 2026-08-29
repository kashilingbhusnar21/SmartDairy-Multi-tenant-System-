package com.smartdairy.security;

import com.smartdairy.entity.User;
import com.smartdairy.repository.FarmerRepository;
import com.smartdairy.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final FarmerRepository farmerRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String requestPath = request.getRequestURI();

        // Skip JWT processing for auth endpoints
        if (requestPath.startsWith("/api/auth/")
                || requestPath.startsWith("/api/farmer/auth/")) {

            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);
        final String username = jwtService.extractUsername(jwt);

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            // Extract role from JWT claims
            String role = jwtService.extractClaim(jwt, claims -> claims.get("role", String.class));

            System.out.println("=== JWT FILTER DEBUG ===");
            System.out.println("Request path: " + requestPath);
            System.out.println("Username from JWT: " + username);
            System.out.println("Role from JWT: " + role);

            UserDetails userDetails = loadUserDetails(username, role);

            if (userDetails != null) {
                System.out.println("UserDetails loaded: " + userDetails.getUsername());
                System.out.println("Authorities: " + userDetails.getAuthorities());
            } else {
                System.out.println("UserDetails is NULL - user not found!");
            }

            if (userDetails != null && jwtService.isTokenValid(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
                System.out.println("Authentication set in SecurityContext");
            } else {
                System.out.println("Token validation failed or userDetails is null");
            }
        }

        filterChain.doFilter(request, response);
    }

    private UserDetails loadUserDetails(String username, String role) {
        System.out.println("loadUserDetails - username: " + username + ", role: " + role);
        if ("FARMER".equals(role)) {
            System.out.println("Loading farmer by mobile number: " + username);
            return farmerRepository.findByMobileNumber(username)
                    .map(farmer -> {
                        System.out.println("Farmer found: " + farmer.getFullName() + ", active: " + farmer.getActive());
                        return new FarmerUserDetails(farmer);
                    })
                    .orElseGet(() -> {
                        System.out.println("Farmer NOT found with mobile number: " + username);
                        return null;
                    });
        }

        System.out.println("Loading admin by email: " + username);
        return userRepository.findByEmail(username)
                .orElseGet(() -> {
                    System.out.println("Admin NOT found with email: " + username);
                    return null;
                });
    }
}

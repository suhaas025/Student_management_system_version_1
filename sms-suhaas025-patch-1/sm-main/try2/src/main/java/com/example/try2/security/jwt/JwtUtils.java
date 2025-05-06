package com.example.try2.security.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import com.example.try2.security.services.UserDetailsImpl;

import java.security.Key;
import java.util.Date;
import java.util.stream.Collectors;

@Component
public class JwtUtils {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${app.jwtSecret}")
    private String jwtSecret;

    @Value("${app.jwtExpirationMs}")
    private int jwtExpirationMs;

    @Value("${app.mfaTokenExpirationMs:300000}")
    private int mfaTokenExpirationMs; // 5 minutes default
    
    @Autowired
    private UserDetailsService userDetailsService;

    private Key getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes();
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateJwtToken(Authentication authentication) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();
        
        // Extract all roles from the user's authorities and join them as a comma-separated string
        String roles = userPrincipal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        return Jwts.builder()
                .setSubject(userPrincipal.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .claim("roles", roles) // Add roles as a claim in the token
                .claim("userId", userPrincipal.getId()) // Add user ID as a claim
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Generates a JWT token from a username string and includes the user's roles and ID
     * This is used when we need to generate a token without an Authentication object
     * (e.g., during MFA validation)
     *
     * @param username The username for which to generate the token
     * @return The JWT token
     */
    public String generateJwtToken(String username) {
        logger.info("Generating JWT token for username: {}", username);
        
        try {
            // Attempt to find user details to include roles and user ID
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            
            if (userDetails != null) {
                // Extract roles from the user's authorities
                String roles = userDetails.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .collect(Collectors.joining(","));
                
                // Check if we can safely cast to UserDetailsImpl to get the ID
                Long userId = null;
                if (userDetails instanceof UserDetailsImpl) {
                    userId = ((UserDetailsImpl) userDetails).getId();
                }
                
                // Build the token with available information
                JwtBuilder tokenBuilder = Jwts.builder()
                        .setSubject(username)
                        .setIssuedAt(new Date())
                        .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                        .claim("roles", roles);
                
                // Add user ID if available
                if (userId != null) {
                    tokenBuilder.claim("userId", userId);
                }
                
                return tokenBuilder.signWith(getSigningKey(), SignatureAlgorithm.HS256)
                        .compact();
            }
        } catch (Exception e) {
            logger.warn("Could not find detailed user information for JWT token, creating simple token: {}", e.getMessage());
        }
        
        // Fallback to simple token if user details can't be found
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String getUserNameFromJwtToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public String getRolesFromJwtToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .get("roles", String.class);
    }

    public Long getUserIdFromJwtToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .get("userId", Long.class);
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(authToken);
            return true;
        } catch (SecurityException e) {
            logger.error("Invalid JWT signature", e);
        } catch (MalformedJwtException e) {
            logger.error("Invalid JWT token", e);
        } catch (ExpiredJwtException e) {
            logger.error("JWT token is expired", e);
        } catch (UnsupportedJwtException e) {
            logger.error("JWT token is unsupported", e);
        } catch (IllegalArgumentException e) {
            logger.error("JWT claims string is empty", e);
        }

        return false;
    }
    
    /**
     * Generates a temporary token for MFA verification
     * 
     * @param username The username
     * @param userId The user ID
     * @return The temporary token
     */
    public String generateMfaToken(String username, Long userId) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + mfaTokenExpirationMs))
                .claim("userId", userId)
                .claim("mfa", true)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }
    
    /**
     * Checks if a token is an MFA token
     * 
     * @param token The token to check
     * @return True if the token is an MFA token
     */
    public boolean isMfaToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            
            return claims.get("mfa", Boolean.class) != null && 
                   claims.get("mfa", Boolean.class);
        } catch (Exception e) {
            return false;
        }
    }
} 
package com.example.try2.security.services;

import com.example.try2.entity.User;
import com.example.try2.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.InvalidKeyException;
import java.security.Key;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
public class MfaService {
    private static final Logger logger = LoggerFactory.getLogger(MfaService.class);
    private static final int TOTP_WINDOW = 2; // Allow +/- 2*30sec
    private static final int BACKUP_CODES_COUNT = 10;
    private static final int BACKUP_CODE_LENGTH = 8;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    /**
     * Generates a new MFA secret for a user
     * 
     * @param user The user to generate a secret for
     * @return The generated secret
     */
    public String generateMfaSecret(User user) {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[20]; // 160 bits for SHA1
        random.nextBytes(bytes);
        
        // Use Base32 encoding instead of Base64
        String secret = base32Encode(bytes);
        
        // Save the secret to the user
        user.setMfaSecret(secret);
        userRepository.save(user);
        
        return secret;
    }
    
    /**
     * Generates a QR code URL for Google Authenticator
     * 
     * @param username The username
     * @param secret The MFA secret
     * @param appName The application name
     * @return The URL for the QR code
     */
    public String generateQrCodeUrl(String username, String secret, String appName) {
        // No need to clean secret if it's already in Base32 format
        String encodedAppName = encodeValue(appName);
        String encodedUsername = encodeValue(username);
        
        return String.format("otpauth://totp/%s:%s?secret=%s&issuer=%s",
                encodedAppName, encodedUsername, secret, encodedAppName);
    }
    
    /**
     * Verifies a TOTP code for a user
     * 
     * @param user The user
     * @param code The code to verify
     * @return True if the code is valid
     */
    public boolean verifyCode(User user, String code) {
        if (user == null || code == null || code.length() != 6) {
            logger.warn("Invalid parameters for TOTP verification: user={}, code={}", 
                    user != null ? user.getUsername() : "null", 
                    code != null ? code.length() : "null");
            return false;
        }
        
        if (!user.isMfaEnabled() && user.getMfaSecret() == null) {
            logger.warn("User does not have MFA enabled or secret is null: {}", user.getUsername());
            return false;
        }
        
        try {
            // Use a larger window during setup to avoid time synchronization issues
            // Standard is 30 seconds per step, allow +/- 5 steps (2.5 minutes in each direction)
            final int WIDER_WINDOW = 5;  // Use wider window during initial setup
            
            long timeWindowCounter = TimeUnit.MILLISECONDS.toSeconds(System.currentTimeMillis()) / 30;
            logger.info("Current time window counter: {}", timeWindowCounter);
            
            // Log expected codes for debugging
            logger.debug("Checking TOTP codes for user: {} with secret: {}", user.getUsername(), user.getMfaSecret());
            
            // Check codes within the wider time window
            for (int i = -WIDER_WINDOW; i <= WIDER_WINDOW; i++) {
                String expectedCode = generateTotpCode(user.getMfaSecret(), timeWindowCounter + i);
                logger.debug("Window {}: Expected code={}, Actual code={}", i, expectedCode, code);
                
                if (expectedCode.equals(code)) {
                    logger.info("TOTP code valid for user {} with time window offset: {}", user.getUsername(), i);
                    return true;
                }
            }
            
            logger.warn("No matching TOTP code found for user: {}", user.getUsername());
            return false;
        } catch (Exception e) {
            logger.error("Error verifying TOTP code for user {}: {}", user.getUsername(), e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Verifies a backup code for a user and consumes it if valid
     * 
     * @param user The user
     * @param code The backup code
     * @return True if the code is valid
     */
    public boolean verifyAndConsumeBackupCode(User user, String code) {
        if (user == null || code == null || code.isEmpty()) {
            return false;
        }
        
        if (!user.isMfaEnabled() || user.getBackupCodes() == null || user.getBackupCodes().isEmpty()) {
            return false;
        }
        
        // Check if any backup code matches
        for (String hashedCode : user.getBackupCodes()) {
            if (passwordEncoder.matches(code, hashedCode)) {
                // Remove the used code
                Set<String> updatedCodes = new HashSet<>(user.getBackupCodes());
                updatedCodes.remove(hashedCode);
                user.setBackupCodes(updatedCodes);
                userRepository.save(user);
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Generates a set of backup codes for a user
     * 
     * @param user The user
     * @return The set of backup codes (not hashed)
     */
    public Set<String> generateBackupCodes(User user) {
        Set<String> backupCodes = new HashSet<>();
        Set<String> hashedCodes = new HashSet<>();
        
        SecureRandom random = new SecureRandom();
        
        // Generate unique backup codes
        while (backupCodes.size() < BACKUP_CODES_COUNT) {
            StringBuilder codeBuilder = new StringBuilder();
            for (int i = 0; i < BACKUP_CODE_LENGTH; i++) {
                codeBuilder.append(random.nextInt(10)); // 0-9 digits
            }
            
            String code = codeBuilder.toString();
            if (!backupCodes.contains(code)) {
                backupCodes.add(code);
                hashedCodes.add(passwordEncoder.encode(code));
            }
        }
        
        // Save hashed codes to the user
        user.setBackupCodes(hashedCodes);
        userRepository.save(user);
        
        return backupCodes;
    }
    
    /**
     * Enables MFA for a user
     * 
     * @param user The user
     * @param verified Whether the MFA has been verified
     */
    public void enableMfa(User user, boolean verified) {
        user.setMfaEnabled(verified);
        userRepository.save(user);
    }
    
    /**
     * Disables MFA for a user
     * 
     * @param user The user
     */
    public void disableMfa(User user) {
        user.setMfaEnabled(false);
        user.setMfaSecret(null);
        user.setBackupCodes(new HashSet<>());
        userRepository.save(user);
    }
    
    // Helper methods
    
    private String generateTotpCode(String secret, long counter) throws NoSuchAlgorithmException, InvalidKeyException {
        // Decode the Base32 secret
        byte[] decodedSecret = base32Decode(secret);
        
        // Create HMAC-SHA1 key
        Key signingKey = new SecretKeySpec(decodedSecret, "HmacSHA1");
        
        // Create HMAC-SHA1 instance
        Mac mac = Mac.getInstance("HmacSHA1");
        mac.init(signingKey);
        
        // Create buffer for the counter
        byte[] buffer = new byte[8];
        for (int i = 7; i >= 0; i--) {
            buffer[i] = (byte) (counter & 0xff);
            counter >>= 8;
        }
        
        // Compute HMAC
        byte[] hash = mac.doFinal(buffer);
        
        // Get offset for dynamic truncation
        int offset = hash[hash.length - 1] & 0xf;
        
        // Get 4 bytes from the hash at the offset
        int binary = ((hash[offset] & 0x7f) << 24) |
                     ((hash[offset + 1] & 0xff) << 16) |
                     ((hash[offset + 2] & 0xff) << 8) |
                     (hash[offset + 3] & 0xff);
        
        // Generate 6-digit code
        int otp = binary % 1000000;
        
        // Add leading zeros if necessary
        return String.format("%06d", otp);
    }
    
    // BASE32 encoding/decoding methods
    private static final String BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    
    private String base32Encode(byte[] data) {
        StringBuilder result = new StringBuilder();
        int bits = 0;
        int value = 0;
        
        for (byte b : data) {
            value = (value << 8) | (b & 0xff);
            bits += 8;
            
            while (bits >= 5) {
                bits -= 5;
                result.append(BASE32_CHARS.charAt((value >> bits) & 0x1f));
            }
        }
        
        if (bits > 0) {
            result.append(BASE32_CHARS.charAt((value << (5 - bits)) & 0x1f));
        }
        
        return result.toString();
    }
    
    private byte[] base32Decode(String input) {
        // Remove padding if any
        String data = input.replaceAll("=", "").toUpperCase();
        
        byte[] result = new byte[data.length() * 5 / 8];
        int buffer = 0;
        int bitsLeft = 0;
        int count = 0;
        
        for (int i = 0; i < data.length(); i++) {
            char ch = data.charAt(i);
            int value = BASE32_CHARS.indexOf(ch);
            
            if (value < 0) {
                continue; // Skip non-base32 chars
            }
            
            buffer = (buffer << 5) | value;
            bitsLeft += 5;
            
            if (bitsLeft >= 8) {
                bitsLeft -= 8;
                result[count++] = (byte) ((buffer >> bitsLeft) & 0xff);
            }
        }
        
        return result;
    }
    
    private String cleanSecret(String secret) {
        // Remove any non-base32 characters
        return secret.replaceAll("[^A-Z2-7]", "");
    }
    
    private String encodeValue(String value) {
        // URL-encode the value
        return value.replace(" ", "%20");
    }
} 
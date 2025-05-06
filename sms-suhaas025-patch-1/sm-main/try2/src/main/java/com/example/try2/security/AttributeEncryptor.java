package com.example.try2.security;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Converter
public class AttributeEncryptor implements AttributeConverter<String, String> {
    private static final Logger logger = LoggerFactory.getLogger(AttributeEncryptor.class);
    private static final String ALGORITHM = "AES";
    // NOTE: In production, use a secure key from environment variable or secrets manager
    private static final byte[] KEY = "1234567890123456".getBytes(StandardCharsets.UTF_8); // 16 bytes for AES-128

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) return null;

        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(KEY, ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec);
            return Base64.getEncoder().encodeToString(cipher.doFinal(attribute.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            logger.error("Error encrypting attribute", e);
            throw new RuntimeException("Error encrypting attribute", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;

        try {
            // Try to decode using standard Base64 decoder
            return decryptWithDecoder(dbData, Base64.getDecoder());
        } catch (IllegalArgumentException e) {
            // If standard decoder fails, try with MIME decoder which is more lenient
            try {
                logger.warn("Standard Base64 decoding failed, trying MIME decoder for: {}",
                        dbData.length() > 10 ? dbData.substring(0, 5) + "..." : dbData);
                return decryptWithDecoder(dbData, Base64.getMimeDecoder());
            } catch (Exception ex) {
                // If MIME decoder also fails, try URL-safe decoder
                try {
                    logger.warn("MIME Base64 decoding failed, trying URL-safe decoder");
                    return decryptWithDecoder(dbData, Base64.getUrlDecoder());
                } catch (Exception urlEx) {
                    // If all decoders fail, log the error and return a fallback value
                    logger.error("Failed to decode with all Base64 decoders. Data might be corrupted: {}",
                            dbData.length() > 10 ? dbData.substring(0, 5) + "..." : dbData);

                    // Return empty string instead of null to prevent further errors
                    // In production, you might want a different fallback strategy
                    return "";
                }
            }
        } catch (Exception e) {
            logger.error("Error decrypting attribute", e);
            // Return empty string as fallback
            return "";
        }
    }

    private String decryptWithDecoder(String dbData, Base64.Decoder decoder) throws Exception {
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        SecretKeySpec keySpec = new SecretKeySpec(KEY, ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, keySpec);

        // Clean the input string if needed (remove whitespace, etc.)
        String cleanedData = dbData.trim();

        byte[] decodedBytes = decoder.decode(cleanedData);
        byte[] decryptedBytes = cipher.doFinal(decodedBytes);
        return new String(decryptedBytes, StandardCharsets.UTF_8);
    }
}

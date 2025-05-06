package com.example.try2.service;

import com.example.try2.entity.EAccountStatus;
import com.example.try2.entity.ERole;
import com.example.try2.entity.Role;
import com.example.try2.entity.User;
import com.example.try2.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AccountManagementService {
    private static final Logger logger = LoggerFactory.getLogger(AccountManagementService.class);
    
    // Default inactivity period for account expiration (30 days in seconds)
    private static final int DEFAULT_EXPIRATION_DAYS = 30;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Checks if a user has the admin role
     * @param user The user to check
     * @return true if the user has the admin role, false otherwise
     */
    private boolean isAdminUser(User user) {
        if (user == null || user.getRoles() == null) {
            return false;
        }
        
        return user.getRoles().stream()
                .anyMatch(role -> role.getName() == ERole.ROLE_ADMIN);
    }
    
    /**
     * Updates the last login date for a user and resets account expiration
     * @param userId The ID of the user
     */
    @Transactional
    public void recordUserLogin(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            // Update last login date
            LocalDateTime now = LocalDateTime.now();
            user.setLastLoginDate(now);
            
            // Admin accounts never expire
            if (isAdminUser(user)) {
                // Set a very distant future date (effectively never expires)
                user.setAccountExpirationDate(now.plusYears(100));
                logger.info("Admin user {} login recorded. Account set to never expire.", userId);
            } else {
                // Calculate and set new expiration date (30 days from now)
                user.setAccountExpirationDate(now.plusDays(DEFAULT_EXPIRATION_DAYS));
                logger.info("User {} login recorded. New expiration date: {}", userId, user.getAccountExpirationDate());
            }
            
            // If account was expired, activate it again
            if (user.getAccountStatus() == EAccountStatus.EXPIRED) {
                user.setAccountStatus(EAccountStatus.ACTIVE);
            }
            
            userRepository.save(user);
        }
    }
    
    /**
     * Checks and updates expired accounts (scheduled job)
     */
    @Scheduled(cron = "0 0 0 * * ?") // Run at midnight every day
    @Transactional
    public void checkExpiredAccounts() {
        logger.info("Running scheduled job to check for expired accounts");
        LocalDateTime now = LocalDateTime.now();
        
        // Find accounts that should be expired
        List<User> expiredUsers = userRepository.findByAccountExpirationDateBeforeAndAccountStatusNot(
                now, EAccountStatus.BLOCKED);
        
        if (!expiredUsers.isEmpty()) {
            // Filter out admin users from expiration
            List<User> nonAdminExpiredUsers = expiredUsers.stream()
                    .filter(user -> !isAdminUser(user))
                    .collect(Collectors.toList());
            
            if (nonAdminExpiredUsers.isEmpty()) {
                logger.info("No non-admin accounts to expire");
                return;
            }
            
            for (User user : nonAdminExpiredUsers) {
                user.setAccountStatus(EAccountStatus.EXPIRED);
                logger.info("Account expired for user: {}", user.getUsername());
            }
            
            userRepository.saveAll(nonAdminExpiredUsers);
            logger.info("Expired {} user accounts", nonAdminExpiredUsers.size());
            
            if (nonAdminExpiredUsers.size() != expiredUsers.size()) {
                logger.info("Skipped expiring {} admin accounts", expiredUsers.size() - nonAdminExpiredUsers.size());
            }
        }
    }
    
    /**
     * Block a user account
     * @param userId The ID of the user to block
     * @return true if successful, false otherwise
     */
    @Transactional
    public boolean blockUser(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            // Prevent blocking admin accounts
            if (isAdminUser(user)) {
                logger.warn("Attempt to block admin account {} was prevented", userId);
                return false;
            }
            
            user.setAccountStatus(EAccountStatus.BLOCKED);
            user.setAccountBlocked(true);
            userRepository.save(user);
            logger.info("User account blocked: {}", userId);
            return true;
        }
        return false;
    }
    
    /**
     * Unblock a user account
     * @param userId The ID of the user to unblock
     * @return true if successful, false otherwise
     */
    @Transactional
    public boolean unblockUser(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            // Admin accounts are handled differently
            boolean isAdmin = isAdminUser(user);
            
            user.setAccountStatus(EAccountStatus.ACTIVE);
            user.setAccountBlocked(false);
            
            // Admin accounts never expire, others get 30 days
            if (isAdmin) {
                user.setAccountExpirationDate(LocalDateTime.now().plusYears(100));
                logger.info("Admin account unblocked and set to never expire: {}", userId);
            } else {
                // Reset expiration to be 30 days from now
                user.setAccountExpirationDate(LocalDateTime.now().plusDays(DEFAULT_EXPIRATION_DAYS));
                logger.info("User account unblocked: {}", userId);
            }
            
            userRepository.save(user);
            return true;
        }
        return false;
    }
    
    /**
     * Extend account expiration date by days
     * @param userId The ID of the user
     * @param days Number of days to extend
     * @return true if successful, false otherwise
     */
    @Transactional
    public boolean extendExpiration(Long userId, int days) {
        if (days <= 0) {
            return false;
        }
        
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            // Admin accounts never expire
            if (isAdminUser(user)) {
                // For admin accounts, we just ensure they have a far future expiration date
                user.setAccountExpirationDate(LocalDateTime.now().plusYears(100));
                user.setAccountStatus(EAccountStatus.ACTIVE);
                userRepository.save(user);
                logger.info("Admin user {} expiration set to never expire", userId);
                return true;
            }
            
            // For regular users, calculate new expiration date
            LocalDateTime currentExpiration = user.getAccountExpirationDate();
            if (currentExpiration == null) {
                currentExpiration = LocalDateTime.now();
            }
            
            LocalDateTime newExpiration = currentExpiration.plusDays(days);
            user.setAccountExpirationDate(newExpiration);
            
            // If account was expired or blocked, reactivate it
            if (user.getAccountStatus() == EAccountStatus.EXPIRED) {
                user.setAccountStatus(EAccountStatus.ACTIVE);
            }
            
            userRepository.save(user);
            logger.info("User {} expiration extended by {} days to {}", userId, days, newExpiration);
            return true;
        }
        return false;
    }
    
    /**
     * Reduce account expiration date by days
     * @param userId The ID of the user
     * @param days Number of days to reduce
     * @return true if successful, false otherwise
     */
    @Transactional
    public boolean reduceExpiration(Long userId, int days) {
        if (days <= 0) {
            return false;
        }
        
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            // Admin accounts should never expire
            if (isAdminUser(user)) {
                logger.info("Skipped reducing expiration for admin user {}", userId);
                return true; // Return success but don't actually reduce
            }
            
            // Calculate new expiration date
            LocalDateTime currentExpiration = user.getAccountExpirationDate();
            if (currentExpiration == null) {
                currentExpiration = LocalDateTime.now().plusDays(DEFAULT_EXPIRATION_DAYS);
            }
            
            LocalDateTime newExpiration = currentExpiration.minusDays(days);
            LocalDateTime now = LocalDateTime.now();
            
            // If new expiration is in the past, set it to now and expire the account
            if (newExpiration.isBefore(now)) {
                user.setAccountExpirationDate(now);
                user.setAccountStatus(EAccountStatus.EXPIRED);
                logger.info("User {} account expired due to reduction in expiration days", userId);
            } else {
                user.setAccountExpirationDate(newExpiration);
            }
            
            userRepository.save(user);
            logger.info("User {} expiration reduced by {} days to {}", userId, days, newExpiration);
            return true;
        }
        return false;
    }
    
    /**
     * Get the account status information for a user
     * @param userId The ID of the user
     * @return Object containing account status information or null if user not found
     */
    public AccountStatusInfo getAccountStatus(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            AccountStatusInfo info = new AccountStatusInfo();
            info.setUserId(user.getId());
            info.setUsername(user.getUsername());
            info.setAccountStatus(user.getAccountStatus());
            info.setLastLoginDate(user.getLastLoginDate());
            info.setExpirationDate(user.getAccountExpirationDate());
            info.setBlocked(user.getAccountBlocked());
            
            // Add role information for UI to identify admin accounts
            if (user.getRoles() != null) {
                info.setRoles(user.getRoles().stream()
                        .map(role -> role.getName().name())
                        .collect(Collectors.toList()));
                
                // Flag if this is an admin account
                info.setIsAdmin(isAdminUser(user));
            }
            
            // Calculate days until expiration
            if (user.getAccountExpirationDate() != null && !isAdminUser(user)) {
                LocalDateTime now = LocalDateTime.now();
                long daysUntilExpiration = java.time.Duration.between(now, user.getAccountExpirationDate()).toDays();
                info.setDaysUntilExpiration(daysUntilExpiration);
            } else if (isAdminUser(user)) {
                // Admin accounts never expire
                info.setDaysUntilExpiration(Long.MAX_VALUE);
            }
            
            return info;
        }
        return null;
    }
    
    /**
     * Inner class to encapsulate account status information
     */
    public static class AccountStatusInfo {
        private Long userId;
        private String username;
        private EAccountStatus accountStatus;
        private LocalDateTime lastLoginDate;
        private LocalDateTime expirationDate;
        private Boolean blocked;
        private Long daysUntilExpiration;
        private List<String> roles;
        private Boolean isAdmin;
        
        // Getters and setters
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        
        public EAccountStatus getAccountStatus() { return accountStatus; }
        public void setAccountStatus(EAccountStatus accountStatus) { this.accountStatus = accountStatus; }
        
        public LocalDateTime getLastLoginDate() { return lastLoginDate; }
        public void setLastLoginDate(LocalDateTime lastLoginDate) { this.lastLoginDate = lastLoginDate; }
        
        public LocalDateTime getExpirationDate() { return expirationDate; }
        public void setExpirationDate(LocalDateTime expirationDate) { this.expirationDate = expirationDate; }
        
        public Boolean getBlocked() { return blocked; }
        public void setBlocked(Boolean blocked) { this.blocked = blocked; }
        
        public Long getDaysUntilExpiration() { return daysUntilExpiration; }
        public void setDaysUntilExpiration(Long daysUntilExpiration) { this.daysUntilExpiration = daysUntilExpiration; }
        
        public List<String> getRoles() { return roles; }
        public void setRoles(List<String> roles) { this.roles = roles; }
        
        public Boolean getIsAdmin() { return isAdmin; }
        public void setIsAdmin(Boolean isAdmin) { this.isAdmin = isAdmin; }
    }
} 
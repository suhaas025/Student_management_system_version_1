package com.example.try2.controller;

import com.example.try2.payload.response.MessageResponse;
import com.example.try2.service.AccountManagementService;
import com.example.try2.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/account-management")
public class AccountManagementController {
    private static final Logger logger = LoggerFactory.getLogger(AccountManagementController.class);

    @Autowired
    private AccountManagementService accountManagementService;

    @Autowired
    private UserService userService;

    /**
     * Get account status for a user (admin can access any account, users can only access their own)
     * @param userId The ID of the user to get status for
     * @return Account status information
     */
    @GetMapping("/status/{userId}")
    @PreAuthorize("hasRole('ADMIN') or @userSecurity.isCurrentUser(#userId)")
    public ResponseEntity<?> getAccountStatus(@PathVariable Long userId) {
        AccountManagementService.AccountStatusInfo status = accountManagementService.getAccountStatus(userId);
        if (status == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(status);
    }

    /**
     * Get account status for the current authenticated user
     * @return Account status information
     */
    @GetMapping("/status/me")
    public ResponseEntity<?> getCurrentUserAccountStatus() {
        // Get the current authenticated user
        org.springframework.security.core.Authentication authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        
        com.example.try2.security.services.UserDetailsImpl userDetails = (com.example.try2.security.services.UserDetailsImpl) authentication.getPrincipal();
        Long userId = userDetails.getId();
        
        AccountManagementService.AccountStatusInfo status = accountManagementService.getAccountStatus(userId);
        if (status == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(status);
    }

    /**
     * Block a user account (admin only)
     * @param userId The ID of the user to block
     * @return Success/failure message
     */
    @PostMapping("/block/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> blockUser(@PathVariable Long userId) {
        boolean success = accountManagementService.blockUser(userId);
        if (success) {
            return ResponseEntity.ok(new MessageResponse("User account blocked successfully"));
        } else {
            AccountManagementService.AccountStatusInfo status = accountManagementService.getAccountStatus(userId);
            if (status != null && Boolean.TRUE.equals(status.getIsAdmin())) {
                return ResponseEntity.badRequest().body(new MessageResponse("Cannot block admin accounts. Admin accounts must remain active."));
            }
            return ResponseEntity.badRequest().body(new MessageResponse("Failed to block user account"));
        }
    }

    /**
     * Unblock a user account (admin only)
     * @param userId The ID of the user to unblock
     * @return Success/failure message
     */
    @PostMapping("/unblock/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> unblockUser(@PathVariable Long userId) {
        boolean success = accountManagementService.unblockUser(userId);
        if (success) {
            return ResponseEntity.ok(new MessageResponse("User account unblocked successfully"));
        } else {
            return ResponseEntity.badRequest().body(new MessageResponse("Failed to unblock user account"));
        }
    }

    /**
     * Extend account expiration date (admin only)
     * @param userId The ID of the user
     * @param days Number of days to extend
     * @return Success/failure message
     */
    @PostMapping("/extend-expiration/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> extendExpiration(@PathVariable Long userId, @RequestParam int days) {
        if (days <= 0) {
            return ResponseEntity.badRequest().body(new MessageResponse("Days must be greater than 0"));
        }
        
        AccountManagementService.AccountStatusInfo status = accountManagementService.getAccountStatus(userId);
        if (status != null && Boolean.TRUE.equals(status.getIsAdmin())) {
            return ResponseEntity.ok(new MessageResponse("Admin accounts never expire. No action needed."));
        }
        
        boolean success = accountManagementService.extendExpiration(userId, days);
        if (success) {
            return ResponseEntity.ok(new MessageResponse("Account expiration extended by " + days + " days"));
        } else {
            return ResponseEntity.badRequest().body(new MessageResponse("Failed to extend account expiration"));
        }
    }

    /**
     * Reduce account expiration date (admin only)
     * @param userId The ID of the user
     * @param days Number of days to reduce
     * @return Success/failure message
     */
    @PostMapping("/reduce-expiration/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> reduceExpiration(@PathVariable Long userId, @RequestParam int days) {
        if (days <= 0) {
            return ResponseEntity.badRequest().body(new MessageResponse("Days must be greater than 0"));
        }
        
        AccountManagementService.AccountStatusInfo status = accountManagementService.getAccountStatus(userId);
        if (status != null && Boolean.TRUE.equals(status.getIsAdmin())) {
            return ResponseEntity.ok(new MessageResponse("Admin accounts never expire. No action needed."));
        }
        
        boolean success = accountManagementService.reduceExpiration(userId, days);
        if (success) {
            return ResponseEntity.ok(new MessageResponse("Account expiration reduced by " + days + " days"));
        } else {
            return ResponseEntity.badRequest().body(new MessageResponse("Failed to reduce account expiration"));
        }
    }
    
    /**
     * Force expire a user account (admin only)
     * @param userId The ID of the user
     * @return Success/failure message
     */
    @PostMapping("/expire/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> expireAccount(@PathVariable Long userId) {
        AccountManagementService.AccountStatusInfo status = accountManagementService.getAccountStatus(userId);
        if (status != null && Boolean.TRUE.equals(status.getIsAdmin())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Admin accounts cannot be expired. Admin accounts must remain active."));
        }
        
        // Use reduceExpiration with a very large number to ensure expiration
        boolean success = accountManagementService.reduceExpiration(userId, 10000);
        if (success) {
            return ResponseEntity.ok(new MessageResponse("Account has been expired"));
        } else {
            return ResponseEntity.badRequest().body(new MessageResponse("Failed to expire account"));
        }
    }
} 
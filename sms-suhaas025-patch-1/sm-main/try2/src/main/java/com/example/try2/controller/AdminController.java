package com.example.try2.controller;

import com.example.try2.entity.User;
import com.example.try2.payload.response.MessageResponse;
import com.example.try2.service.AccountManagementService;
import com.example.try2.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);

    @Autowired
    private UserService userService;

    @Autowired
    private AccountManagementService accountManagementService;

    /**
     * Get account status for all users
     * @return List of account status information
     */
    @GetMapping("/accounts/status")
    public ResponseEntity<?> getAllAccountsStatus() {
        logger.info("Getting status for all user accounts");
        
        // Get all users
        List<User> users = userService.getAllUsersEntities();
        
        // Map to account status
        List<AccountManagementService.AccountStatusInfo> accountStatusList = users.stream()
                .map(user -> accountManagementService.getAccountStatus(user.getId()))
                .filter(status -> status != null)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(accountStatusList);
    }
    
    /**
     * Get count of accounts by status (active, expired, blocked)
     * @return Map of status counts
     */
    @GetMapping("/accounts/status/summary")
    public ResponseEntity<?> getAccountStatusSummary() {
        logger.info("Getting account status summary");
        
        // Get all users
        List<User> users = userService.getAllUsersEntities();
        
        Map<String, Integer> statusCounts = new HashMap<>();
        statusCounts.put("active", 0);
        statusCounts.put("expired", 0);
        statusCounts.put("blocked", 0);
        statusCounts.put("total", users.size());
        
        // Count by status
        for (User user : users) {
            if (user.getAccountBlocked() != null && user.getAccountBlocked()) {
                statusCounts.put("blocked", statusCounts.get("blocked") + 1);
            } else if (user.getAccountStatus() != null) {
                switch (user.getAccountStatus()) {
                    case ACTIVE:
                        statusCounts.put("active", statusCounts.get("active") + 1);
                        break;
                    case EXPIRED:
                        statusCounts.put("expired", statusCounts.get("expired") + 1);
                        break;
                    case BLOCKED:
                        statusCounts.put("blocked", statusCounts.get("blocked") + 1);
                        break;
                }
            } else {
                // Default to active if not set
                statusCounts.put("active", statusCounts.get("active") + 1);
            }
        }
        
        return ResponseEntity.ok(statusCounts);
    }
} 
package com.example.try2.controller;

import com.example.try2.entity.EModeratorType;
import com.example.try2.entity.ERole;
import com.example.try2.entity.Role;
import com.example.try2.entity.User;
import com.example.try2.payload.request.UpdateUserRequest;
import com.example.try2.payload.request.UpdateUserRolesRequest;
import com.example.try2.payload.response.ErrorResponse;
import com.example.try2.payload.response.MessageResponse;
import com.example.try2.payload.response.UserResponse;
import com.example.try2.repository.RoleRepository;
import com.example.try2.repository.UserRepository;
import com.example.try2.security.services.UserDetailsImpl;
import com.example.try2.service.ActivityLogService;
import com.example.try2.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.SortDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.*;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {
    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private UserService userService;

    @Autowired
    private ActivityLogService activityLogService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('USER') or hasRole('MODERATOR') or hasRole('ADMIN') or hasRole('STUDENT')")
    public ResponseEntity<UserResponse> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Long userId = userDetails.getId();
        
        logger.info("Fetching current user profile for ID: {}", userId);
        logger.info("User has authorities: {}", userDetails.getAuthorities());
        
        UserResponse userResponse = userService.getUserById(userId);
        
        // Log the roles for debugging
        if (userResponse.getRoles() != null) {
            logger.info("User has {} roles in response", userResponse.getRoles().size());
            userResponse.getRoles().forEach(role -> 
                logger.info("Role in response: {}", role.getName()));
        } else {
            logger.warn("No roles found in user response");
        }
        
        return ResponseEntity.ok(userResponse);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<UserResponse>> getAllUsers(
            @RequestParam(value = "username", required = false) String username,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "department", required = false) String department,
            @RequestParam(value = "role", required = false) String role,
            @PageableDefault(size = 20) @SortDefault.SortDefaults({
                @SortDefault(sort = "id")
            }) Pageable pageable
    ) {
        return ResponseEntity.ok(userService.searchUsers(username, email, department, role, pageable));
    }

    @GetMapping("/moderators")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllModerators(
            @RequestParam(name = "type", required = false) String moderatorType) {
        
        if (moderatorType != null && !moderatorType.isEmpty()) {
            logger.info("Fetching moderators of type: {}", moderatorType);
            try {
                EModeratorType type = EModeratorType.valueOf(moderatorType);
                return ResponseEntity.ok(userService.getTeachersByModeratorType(type));
            } catch (IllegalArgumentException e) {
                logger.warn("Invalid moderator type: {}", moderatorType);
                return ResponseEntity.badRequest().build();
            }
        }
        
        logger.info("Fetching all moderators");
        return ResponseEntity.ok(userService.getAllModerators());
    }

    @GetMapping("/students")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<List<UserResponse>> getAllStudents() {
        return ResponseEntity.ok(userService.getAllStudents());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('USER') and #id == authentication.principal.id)")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('USER') and #id == authentication.principal.id)")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest updateUserRequest) {
        try {
            logger.info("Received update request for user ID: {}", id);
            logger.info("Update request data: {}", updateUserRequest);
            
            if (updateUserRequest.getRole() != null) {
                logger.info("Role data in request: {}", updateUserRequest.getRole());
            } else {
                logger.warn("No role data in update request");
            }
            
            UserResponse updatedUser = userService.updateUser(id, updateUserRequest);
            logger.info("User updated successfully: {}", updatedUser.getUsername());
            // Log user update
            activityLogService.logAction(id, updatedUser.getUsername(), "USER_UPDATE", "User updated their profile or was updated by admin");
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            logger.error("Error updating user: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Error updating user: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserRoles(@PathVariable Long id, @RequestBody UpdateUserRolesRequest request) {
        // Check if user exists
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: User not found with ID: " + id));
        
        logger.info("Updating roles for user ID {}: {}", id, request.getRoles());
        
        // Update roles
        Set<String> strRoles = request.getRoles();
        Set<Role> roles = new HashSet<>();
        
        // Track if ROLE_USER was added as a fallback
        final java.util.concurrent.atomic.AtomicBoolean addedUserAsFallback = new java.util.concurrent.atomic.AtomicBoolean(false);
        
        if (strRoles == null || strRoles.isEmpty()) {
            logger.info("No roles specified, assigning default ROLE_USER");
            Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                    .orElseThrow(() -> new RuntimeException("Error: ROLE_USER not found."));
            roles.add(userRole);
            logger.info("Added ROLE_USER");
        } else {
            logger.info("Processing {} role(s)", strRoles.size());
            strRoles.forEach(role -> {
                String roleLower = role.toLowerCase().trim();
                logger.info("Processing role: '{}'", roleLower);
                
                switch (roleLower) {
                    case "admin":
                        Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                                .orElseThrow(() -> new RuntimeException("Error: ROLE_ADMIN not found."));
                        roles.add(adminRole);
                        logger.info("Added ROLE_ADMIN");
                        break;
                    case "mod":
                    case "moderator":
                        Role modRole = roleRepository.findByName(ERole.ROLE_MODERATOR)
                                .orElseThrow(() -> new RuntimeException("Error: ROLE_MODERATOR not found."));
                        roles.add(modRole);
                        logger.info("Added ROLE_MODERATOR");
                        break;
                    case "student":
                        // Try to find ROLE_STUDENT, but fall back to ROLE_USER if not found
                        try {
                            Role studentRole = roleRepository.findByName(ERole.ROLE_STUDENT)
                                    .orElseThrow(() -> new RuntimeException("ROLE_STUDENT not found"));
                            roles.add(studentRole);
                            logger.info("Added ROLE_STUDENT");
                        } catch (RuntimeException e) {
                            // Fall back to ROLE_USER since ROLE_STUDENT doesn't exist
                            logger.info("ROLE_STUDENT not found, using ROLE_USER instead");
                            Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                                    .orElseThrow(() -> new RuntimeException("Error: ROLE_USER not found."));
                            roles.add(userRole);
                            addedUserAsFallback.set(true); // Mark that we added USER as a fallback
                            logger.info("Added ROLE_USER (as fallback for student)");
                        }
                        break;
                    case "user":
                        Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                                .orElseThrow(() -> new RuntimeException("Error: ROLE_USER not found."));
                        roles.add(userRole);
                        logger.info("Added ROLE_USER");
                        break;
                    default:
                        logger.warn("Unknown role: '{}', adding default ROLE_USER", role);
                        Role defaultRole = roleRepository.findByName(ERole.ROLE_USER)
                                .orElseThrow(() -> new RuntimeException("Error: ROLE_USER not found."));
                        roles.add(defaultRole);
                        logger.info("Added ROLE_USER (default)");
                }
            });
        }
        
        // Remove ROLE_USER if we have other roles and didn't explicitly request it
        if (roles.size() > 1 && !strRoles.contains("user") && !addedUserAsFallback.get()) {
            roles.removeIf(role -> role.getName() == ERole.ROLE_USER);
            logger.info("Removed default ROLE_USER since other roles were specified");
        }
        
        // Set new roles and save
        user.setRoles(roles);
        userRepository.save(user);
        
        logger.info("User roles updated successfully to: {}", 
                roles.stream().map(r -> r.getName().name()).collect(Collectors.joining(", ")));
        
        return ResponseEntity.ok(new MessageResponse("User roles updated successfully to: " + 
                roles.stream().map(r -> r.getName().name()).collect(Collectors.joining(", "))));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        // Log user deletion
        activityLogService.logAction(id, "", "USER_DELETE", "User deleted by admin");
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/avatar")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<?> uploadAvatar(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(new MessageResponse("File is empty"));
            }
            if (file.getSize() > 2 * 1024 * 1024) { // 2MB
                return ResponseEntity.badRequest().body(new MessageResponse("File size exceeds 2MB limit"));
            }
            String contentType = file.getContentType();
            if (!("image/jpeg".equals(contentType) || "image/png".equals(contentType) || "image/webp".equals(contentType))) {
                return ResponseEntity.badRequest().body(new MessageResponse("Only JPEG, PNG, and WEBP images are allowed"));
            }
            String filename = StringUtils.cleanPath(file.getOriginalFilename());
            String ext = filename.contains(".") ? filename.substring(filename.lastIndexOf('.')) : "";
            String newFilename = "avatar_" + id + "_" + System.currentTimeMillis() + ext;
            Path uploadPath = Paths.get("uploads/avatars");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            Path filePath = uploadPath.resolve(newFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Update user
            User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
            user.setAvatar("/api/users/avatar/" + newFilename);
            userRepository.save(user);

            return ResponseEntity.ok(new MessageResponse("Avatar uploaded successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new MessageResponse("Could not upload avatar: " + e.getMessage()));
        }
    }

    @GetMapping("/avatar/{filename:.+}")
    public ResponseEntity<Resource> getAvatar(@PathVariable String filename) {
        try {
            Path filePath = Paths.get("uploads/avatars").resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) contentType = "application/octet-stream";
            return ResponseEntity.ok()
                .header("Content-Type", contentType)
                .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/{id}/profile-update")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<?> updateProfileWithAvatar(
            @PathVariable Long id,
            @RequestParam(value = "username", required = false) String username,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        try {
            // Security check - only admin or the user themselves can update their profile
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Long currentUserId = userDetails.getId();
            
            if (!currentUserId.equals(id) && !authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
                return ResponseEntity.status(403).body(new MessageResponse("Not authorized to update this user"));
            }
            
            // Prepare update data
            UpdateUserRequest updateData = new UpdateUserRequest();
            if (username != null && !username.trim().isEmpty()) {
                updateData.setUsername(username);
            }
            if (email != null && !email.trim().isEmpty()) {
                updateData.setEmail(email);
            }
            
            // Process avatar if provided
            String avatarUrl = null;
            if (file != null && !file.isEmpty()) {
                // Validate file
                if (file.getSize() > 2 * 1024 * 1024) { // 2MB
                    return ResponseEntity.badRequest().body(new MessageResponse("File size exceeds 2MB limit"));
                }
                String contentType = file.getContentType();
                if (!("image/jpeg".equals(contentType) || "image/png".equals(contentType) || "image/webp".equals(contentType))) {
                    return ResponseEntity.badRequest().body(new MessageResponse("Only JPEG, PNG, and WEBP images are allowed"));
                }
                
                // Save file
                String filename = StringUtils.cleanPath(file.getOriginalFilename());
                String ext = filename.contains(".") ? filename.substring(filename.lastIndexOf('.')) : "";
                String newFilename = "avatar_" + id + "_" + System.currentTimeMillis() + ext;
                Path uploadPath = Paths.get("uploads/avatars");
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }
                Path filePath = uploadPath.resolve(newFilename);
                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                
                // Set avatar URL
                avatarUrl = "/api/users/avatar/" + newFilename;
                updateData.setAvatar(avatarUrl);
            }
            
            // Update user
            UserResponse updatedUser = userService.updateUser(id, updateData);
            
            // Return appropriate message
            if (avatarUrl != null) {
                updatedUser.setAvatar(avatarUrl);
            }
            
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            logger.error("Error updating profile with avatar", e);
            return ResponseEntity.status(500).body(new MessageResponse("Could not update profile: " + e.getMessage()));
        }
    }

    @PostMapping("/migrate-encrypt-emails")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> migrateEncryptEmails() {
        try {
            userService.encryptAllPlainEmailsNative();
            return ResponseEntity.ok(new MessageResponse("Migration complete. Check logs for details."));
        } catch (Exception e) {
            logger.error("Migration failed: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(new MessageResponse("Migration failed: " + e.getMessage()));
        }
    }

    @GetMapping("/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<String>> getAllRoles() {
        return ResponseEntity.ok(
            java.util.Arrays.stream(com.example.try2.entity.ERole.values())
                .map(Enum::name)
                .collect(java.util.stream.Collectors.toList())
        );
    }

    @GetMapping("/moderator-types")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<String>> getAllModeratorTypes() {
        return ResponseEntity.ok(
            java.util.Arrays.stream(com.example.try2.entity.EModeratorType.values())
                .map(Enum::name)
                .collect(java.util.stream.Collectors.toList())
        );
    }
} 
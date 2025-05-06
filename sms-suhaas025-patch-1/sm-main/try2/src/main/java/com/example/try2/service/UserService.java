package com.example.try2.service;

import com.example.try2.entity.EModeratorType;
import com.example.try2.entity.ERole;
import com.example.try2.entity.Role;
import com.example.try2.entity.User;
import com.example.try2.payload.request.UpdateUserRequest;
import com.example.try2.payload.response.RoleResponse;
import com.example.try2.payload.response.UserResponse;
import com.example.try2.repository.RoleRepository;
import com.example.try2.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.example.try2.entity.Announcement;
import com.example.try2.entity.Course;
import com.example.try2.entity.Grade;
import com.example.try2.repository.AnnouncementRepository;
import com.example.try2.repository.CourseRepository;
import com.example.try2.repository.GradeRepository;
import com.example.try2.security.AttributeEncryptor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import com.example.try2.security.services.UserDetailsImpl;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Predicate;
import com.example.try2.entity.QUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.example.try2.entity.Department;
import com.example.try2.repository.DepartmentRepository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;
import java.time.LocalDateTime;

@Service
public class UserService {
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Value("${app.upload.dir:${user.home}}")
    private String uploadDir;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private GradeRepository gradeRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private DepartmentRepository departmentRepository;

    private User getCurrentUser() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User saveUser(User user) {
        User currentUser = getCurrentUser();
        user.setCreatedBy(currentUser);
        user.setUpdatedBy(currentUser);
        return userRepository.save(user);
    }
    

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public UserResponse getUserById(Long id) {
        logger.info("Fetching user with ID: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));
        logger.info("Found user: {}", user.getUsername());
        return mapUserToResponse(user);
    }

    public User getUserFromResponse(UserResponse response) {
        return userRepository.findById(response.getId())
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + response.getId()));
    }

    public List<User> getUsersByRole(ERole role) {
        return userRepository.findByRoles_Name(role);
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest updateUserRequest) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));

        logger.info("Updating user: {}, ID: {}", user.getUsername(), id);
        logger.debug("Update request data: {}", updateUserRequest);

        // Update email if provided
        if (updateUserRequest.getEmail() != null && !updateUserRequest.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(updateUserRequest.getEmail())) {
                throw new RuntimeException("Email is already in use!");
            }
            user.setEmail(updateUserRequest.getEmail());
        }

        // Update username if provided
        if (updateUserRequest.getUsername() != null) {
            user.setUsername(updateUserRequest.getUsername());
        }

        // Update password if provided
        if (updateUserRequest.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(updateUserRequest.getPassword()));
        }

        try {
            // Update roles if provided
            if (updateUserRequest.getRole() != null && !updateUserRequest.getRole().isEmpty()) {
                Set<Role> roles = new HashSet<>();
                
                // Log the incoming role data for debugging
                logger.info("Received roles in update request: {}", updateUserRequest.getRole());
                
                updateUserRequest.getRole().forEach(role -> {
                    // Make sure role is not null or empty
                    if (role == null || role.isEmpty()) {
                        logger.warn("Received null or empty role in update request");
                        return;
                    }
                    
                    // Normalize the role name (trim, lowercase, remove 'role_' prefix if present)
                    String normalizedRole = role.trim().toLowerCase();
                    if (normalizedRole.startsWith("role_")) {
                        normalizedRole = normalizedRole.substring(5);
                    }
                    
                    logger.info("Processing normalized role: {}", normalizedRole);
                    
                    switch (normalizedRole) {
                        case "admin":
                            Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                                    .orElseThrow(() -> new RuntimeException("Error: Admin role is not found."));
                            roles.add(adminRole);
                            break;
                        case "mod":
                        case "moderator":
                            Role modRole = roleRepository.findByName(ERole.ROLE_MODERATOR)
                                    .orElseThrow(() -> new RuntimeException("Error: Moderator role is not found."));
                            roles.add(modRole);
                            break;
                        case "user":
                        case "student":
                            Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                                    .orElseThrow(() -> new RuntimeException("Error: User role is not found."));
                            roles.add(userRole);
                            break;
                        default:
                            logger.warn("Unknown role received: {}", normalizedRole);
                            throw new RuntimeException("Error: Role " + normalizedRole + " is not recognized.");
                    }
                });
                
                if (!roles.isEmpty()) {
                    user.setRoles(roles);
                    logger.info("Updated user roles to: {}", roles.stream()
                            .map(r -> r.getName().toString())
                            .collect(Collectors.joining(", ")));
                } else {
                    logger.warn("No valid roles provided in update request");
                }
            } else {
                logger.info("No roles provided in update request, keeping existing roles");
            }

            // Update moderator type if provided
            if (updateUserRequest.getModeratorType() != null) {
                user.setModeratorType(updateUserRequest.getModeratorType());
                logger.info("Updated moderator type to: {}", updateUserRequest.getModeratorType());
            }

            // Update student-specific fields if provided
            if (updateUserRequest.getDegree() != null) {
                user.setDegree(updateUserRequest.getDegree());
            }
            // Handle department by ID
            if (updateUserRequest.getDepartmentId() != null) {
                Department dept = departmentRepository.findById(updateUserRequest.getDepartmentId())
                        .orElseThrow(() -> new RuntimeException("Department not found"));
                user.setDepartment(dept);
            }
            
            if (updateUserRequest.getYearOfStudy() != null) {
                user.setYearOfStudy(updateUserRequest.getYearOfStudy());
            }

            // Update moderator-specific fields if provided
            if (updateUserRequest.getSpecialization() != null) {
                user.setSpecialization(updateUserRequest.getSpecialization());
            }
            if (updateUserRequest.getHostelName() != null) {
                user.setHostelName(updateUserRequest.getHostelName());
            }
            if (updateUserRequest.getLibrarySection() != null) {
                user.setLibrarySection(updateUserRequest.getLibrarySection());
            }
            if (updateUserRequest.getLabName() != null) {
                user.setLabName(updateUserRequest.getLabName());
            }
            if (updateUserRequest.getSportsCategory() != null) {
                user.setSportsCategory(updateUserRequest.getSportsCategory());
            }
            if (updateUserRequest.getCulturalCategory() != null) {
                user.setCulturalCategory(updateUserRequest.getCulturalCategory());
            }
            if (updateUserRequest.getAcademicProgram() != null) {
                user.setAcademicProgram(updateUserRequest.getAcademicProgram());
            }

            // Update avatar if provided
            if (updateUserRequest.getAvatar() != null) {
                user.setAvatar(updateUserRequest.getAvatar());
            }

            // Log the user's roles before saving
            logger.info("User roles before save: {}", user.getRoles().stream()
                    .map(role -> role.getName().name())
                    .collect(Collectors.joining(", ")));

            user.setUpdatedBy(getCurrentUser());

            User updatedUser = userRepository.save(user);
            
            // Log the updated user details
            logger.info("User updated successfully: {}", updatedUser.getUsername());
            logger.info("Updated department: '{}'", updatedUser.getDepartment());
            
            // Log the user's roles after saving
            logger.info("User roles after save: {}", updatedUser.getRoles().stream()
                    .map(role -> role.getName().name())
                    .collect(Collectors.joining(", ")));

            return mapUserToResponse(updatedUser);
        } catch (Exception e) {
            logger.error("Error updating user: {}", e.getMessage(), e);
            throw new RuntimeException("Error updating user: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void deleteUser(Long id) {
        logger.info("Attempting to delete user with ID: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));
        
        // Prevent deleting the last admin
        if (user.getRoles().stream().anyMatch(role -> role.getName() == ERole.ROLE_ADMIN)) {
            long adminCount = userRepository.countByRoles_Name(ERole.ROLE_ADMIN);
            if (adminCount <= 1) {
                throw new RuntimeException("Cannot delete the last admin user");
            }
        }
        
        // Handle cascade deletion manually
        try {
            logger.info("Deleting related records for user: {}", user.getUsername());
            
            // Delete announcements created by this user
            if (announcementRepository != null) {
                try {
                    List<Announcement> userAnnouncements = announcementRepository.findByCreatedById(user.getId());
                    if (userAnnouncements != null && !userAnnouncements.isEmpty()) {
                        logger.info("Deleting {} announcements for user {}", userAnnouncements.size(), user.getUsername());
                        announcementRepository.deleteAll(userAnnouncements);
                    }
                } catch (Exception e) {
                    logger.warn("Error deleting user announcements: {}", e.getMessage());
                }
            }
            
            // Delete grades for this user (if user is a student)
            if (gradeRepository != null) {
                try {
                    List<Grade> userGrades = gradeRepository.findByStudent_Id(user.getId());
                    if (userGrades != null && !userGrades.isEmpty()) {
                        logger.info("Deleting {} grades for student {}", userGrades.size(), user.getUsername());
                        gradeRepository.deleteAll(userGrades);
                    }
                } catch (Exception e) {
                    logger.warn("Error deleting user grades: {}", e.getMessage());
                }
            }
            
            // Delete courses taught by this user (if user is a teacher/moderator)
            if (courseRepository != null) {
                try {
                    List<Course> userCourses = courseRepository.findByTeacher_Id(user.getId());
                    if (userCourses != null && !userCourses.isEmpty()) {
                        logger.info("Reassigning {} courses from teacher {}", userCourses.size(), user.getUsername());
                        // Instead of deleting, we'll set the teacher to null to maintain course integrity
                        userCourses.forEach(course -> course.setTeacher(null));
                        courseRepository.saveAll(userCourses);
                    }
                } catch (Exception e) {
                    logger.warn("Error handling user courses: {}", e.getMessage());
                }
            }
            
            // Now delete the user
            logger.info("Deleting user: {}", user.getUsername());
            userRepository.delete(user);
            logger.info("User {} successfully deleted", user.getUsername());
        } catch (Exception e) {
            logger.error("Error during cascade deletion of user {}: {}", user.getUsername(), e.getMessage());
            throw new RuntimeException("Failed to delete user due to related records: " + e.getMessage());
        }
    }

    public List<UserResponse> getAllModerators() {
        Role moderatorRole = roleRepository.findByName(ERole.ROLE_MODERATOR)
                .orElseThrow(() -> new RuntimeException("Moderator role not found"));
        
        return userRepository.findByRolesContaining(moderatorRole)
                .stream()
                .map(this::mapUserToResponse)
                .collect(Collectors.toList());
    }

    public List<UserResponse> getModeratorsByType(EModeratorType moderatorType) {
        logger.info("Fetching moderators with type: {}", moderatorType);
        
        Role moderatorRole = roleRepository.findByName(ERole.ROLE_MODERATOR)
                .orElseThrow(() -> new RuntimeException("Moderator role not found"));
        
        return userRepository.findByRolesContainingAndModeratorType(moderatorRole, moderatorType)
                .stream()
                .map(this::mapUserToResponse)
                .collect(Collectors.toList());
    }

    public List<UserResponse> getAllStudents() {
        logger.info("Fetching all students");
        try {
            // Try to find ROLE_STUDENT first
            Role studentRole = roleRepository.findByName(ERole.ROLE_STUDENT)
                    .orElse(null);
            
            if (studentRole != null) {
                logger.info("Found ROLE_STUDENT, fetching users with this role");
                return userRepository.findByRolesContaining(studentRole)
                        .stream()
                        .map(this::mapUserToResponse)
                        .collect(Collectors.toList());
            } else {
                // Fall back to ROLE_USER if ROLE_STUDENT doesn't exist
                logger.info("ROLE_STUDENT not found, falling back to ROLE_USER");
                Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                        .orElseThrow(() -> {
                            logger.error("Neither ROLE_STUDENT nor ROLE_USER found");
                            return new RuntimeException("No student roles found in the system");
                        });
                
                return userRepository.findByRolesContaining(userRole)
                        .stream()
                        .map(this::mapUserToResponse)
                        .collect(Collectors.toList());
            }
        } catch (Exception e) {
            logger.error("Error fetching students: {}", e.getMessage(), e);
            // Return an empty list instead of throwing an exception
            return new ArrayList<>();
        }
    }

    public List<UserResponse> getAllUsers() {
        logger.info("Fetching all users from database");
        
        List<User> users = userRepository.findAll();
        logger.info("Found {} users", users.size());
        
        List<UserResponse> userResponses = users.stream()
                .map(this::mapUserToResponse)
                .collect(Collectors.toList());
        
        // Log all users with their departments for debugging
        for (int i = 0; i < users.size() && i < userResponses.size(); i++) {
            User user = users.get(i);
            UserResponse response = userResponses.get(i);
            logger.debug("User: {}, DB Department: '{}', Response Department: '{}'", 
                    user.getUsername(), user.getDepartment(), response.getDepartmentName());
        }
        
        return userResponses;
    }

    /**
     * Get all user entities from the database
     * @return List of User entities
     */
    public List<User> getAllUsersEntities() {
        logger.info("Fetching all user entities from database");
        return userRepository.findAll();
    }

    private UserResponse mapUserToResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setAvatar(user.getAvatar());
        // Always set department name if present
        response.setDepartmentName(user.getDepartment() != null ? user.getDepartment().getName() : null);
        
        // Map all roles to the response
        response.setRoles(user.getRoles().stream()
                .map(role -> {
                    RoleResponse roleResponse = new RoleResponse();
                    roleResponse.setId(role.getId());
                    roleResponse.setName(role.getName());
                    return roleResponse;
                })
                .collect(Collectors.toSet()));

        // Log all roles for debugging
        logger.debug("User {} has {} roles: {}", 
            user.getUsername(), 
            user.getRoles().size(),
            user.getRoles().stream().map(r -> r.getName().toString()).collect(Collectors.joining(", ")));
        
        // Check for specific roles and set fields accordingly
        Set<ERole> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());
        
        // Set student fields if user has student role
        if (roleNames.contains(ERole.ROLE_STUDENT) || roleNames.contains(ERole.ROLE_USER)) {
            // Set student fields but without overriding department which we already set
            response.setDegree(user.getDegree());
            response.setYearOfStudy(user.getYearOfStudy());
        }
        
        // Set moderator fields if user has moderator role
        if (roleNames.contains(ERole.ROLE_MODERATOR)) {
            response.setModeratorFields(
                user.getModeratorType(),
                user.getSpecialization(),
                user.getHostelName(),
                user.getLibrarySection(),
                user.getLabName(),
                user.getSportsCategory(),
                user.getCulturalCategory(),
                user.getAcademicProgram()
            );
        }
        
        // Set MFA status
        response.setMfaEnabled(user.isMfaEnabled());
        
        // Set account status information
        if (user.getAccountStatus() != null) {
            response.setAccountStatus(user.getAccountStatus().toString());
        }
        
        if (user.getLastLoginDate() != null) {
            response.setLastLoginDate(user.getLastLoginDate().toString());
        }
        
        if (user.getAccountExpirationDate() != null) {
            response.setExpirationDate(user.getAccountExpirationDate().toString());
            
            // Calculate days until expiration
            LocalDateTime now = LocalDateTime.now();
            long daysUntilExpiration = java.time.Duration.between(now, user.getAccountExpirationDate()).toDays();
            response.setDaysUntilExpiration(daysUntilExpiration);
        }
        
        response.setAccountBlocked(user.getAccountBlocked());
        
        return response;
    }

    public UserResponse updateUser(Long id, User userDetails) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setUsername(userDetails.getUsername());
        user.setEmail(userDetails.getEmail());
        user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
        user.setRoles(userDetails.getRoles());
        user.setModeratorType(userDetails.getModeratorType());
        user.setDepartment(userDetails.getDepartment());
        user.setSpecialization(userDetails.getSpecialization());
        user.setHostelName(userDetails.getHostelName());
        user.setLibrarySection(userDetails.getLibrarySection());
        user.setLabName(userDetails.getLabName());
        user.setSportsCategory(userDetails.getSportsCategory());
        user.setCulturalCategory(userDetails.getCulturalCategory());
        user.setAcademicProgram(userDetails.getAcademicProgram());

        User updatedUser = userRepository.save(user);
        return mapUserToResponse(updatedUser);
    }

    private boolean isStudent(User user) {
        return user.getRoles().stream()
                .anyMatch(role -> role.getName() == ERole.ROLE_STUDENT);
    }

    public List<UserResponse> getTeachersByModeratorType(EModeratorType moderatorType) {
        logger.info("Fetching all users with moderatorType: {}", moderatorType);
        return userRepository.findByModeratorType(moderatorType)
                .stream()
                .map(this::mapUserToResponse)
                .collect(Collectors.toList());
    }

    // --- Password Reset Token Service (In-Memory, for demo/dev) ---
    public static class PasswordResetService {
        private static final long EXPIRY_MILLIS = 15 * 60 * 1000; // 15 minutes
        private static final java.util.Map<String, TokenRecord> tokenStore = new java.util.concurrent.ConcurrentHashMap<>();

        private static class TokenRecord {
            String username;
            long expiry;
            TokenRecord(String username, long expiry) {
                this.username = username;
                this.expiry = expiry;
            }
        }

        public String createToken(String username) {
            String token = java.util.UUID.randomUUID().toString();
            long expiry = System.currentTimeMillis() + EXPIRY_MILLIS;
            tokenStore.put(token, new TokenRecord(username, expiry));
            return token;
        }

        public boolean validateToken(String username, String token) {
            TokenRecord rec = tokenStore.get(token);
            if (rec == null) return false;
            if (!rec.username.equals(username)) return false;
            if (System.currentTimeMillis() > rec.expiry) {
                tokenStore.remove(token);
                return false;
            }
            return true;
        }

        public void invalidateToken(String token) {
            tokenStore.remove(token);
        }
    }

    /**
     * One-time migration: Encrypt all plain-text emails in the database using JDBC (bypassing JPA converters).
     * Call this method manually to fix existing data.
     */
    @Transactional
    public void encryptAllPlainEmailsNative() {
        AttributeEncryptor encryptor = new AttributeEncryptor();
        List<Map<String, Object>> users = jdbcTemplate.queryForList("SELECT id, email FROM users");
        int updated = 0, failed = 0;
        for (Map<String, Object> row : users) {
            Long id = ((Number) row.get("id")).longValue();
            String email = (String) row.get("email");
            if (email == null) continue;
            try {
                encryptor.convertToEntityAttribute(email);
                // Already encrypted
            } catch (Exception e) {
                try {
                    String encrypted = encryptor.convertToDatabaseColumn(email);
                    jdbcTemplate.update("UPDATE users SET email = ? WHERE id = ?", encrypted, id);
                    updated++;
                    logger.info("Encrypted email for user id {}: {}", id, email);
                } catch (Exception ex) {
                    failed++;
                    logger.error("Failed to encrypt email for user id {}: {}. Error: {}", id, email, ex.getMessage());
                }
            }
        }
        logger.info("Migration complete. Emails updated: {}, failed: {}", updated, failed);
    }

    /**
     * One-time migration: Set createdBy and updatedBy to a default admin user for all users where these fields are null.
     * Call this method manually to fix existing data.
     */
    @Transactional
    public void setCreatedByAndUpdatedByForAllUsers(Long adminUserId) {
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Admin user not found with ID: " + adminUserId));
        List<User> users = userRepository.findAll();
        int updated = 0;
        for (User user : users) {
            boolean changed = false;
            if (user.getCreatedBy() == null) {
                user.setCreatedBy(admin);
                changed = true;
            }
            if (user.getUpdatedBy() == null) {
                user.setUpdatedBy(admin);
                changed = true;
            }
            if (changed) {
                userRepository.save(user);
                updated++;
            }
        }
        logger.info("User migration complete. Records updated: {}", updated);
    }

    @Transactional
    public void fixBlankEmails() {
        List<User> users = userRepository.findAll();
        boolean changed = false;
        for (User user : users) {
            if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                user.setEmail("dummy_" + user.getId() + "@example.com");
                changed = true;
                logger.warn("Fixed blank email for user id {} (username: {})", user.getId(), user.getUsername());
            }
        }
        if (changed) {
            userRepository.saveAll(users);
            logger.info("Blank emails fixed and saved.");
        } else {
            logger.info("No blank emails found to fix.");
        }
    }

    /**
     * QueryDSL-powered search for users with filtering, sorting, and pagination.
     */
    public Page<UserResponse> searchUsers(
            String username,
            String email,
            String department,
            String role,
            Pageable pageable
    ) {
        QUser qUser = QUser.user;
        BooleanBuilder builder = new BooleanBuilder();
        if (email != null && !email.isBlank()) {
            // Use repository method for encrypted email search
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                // Optionally, check other filters (username, department, role) here
                boolean matches = true;
                if (username != null && !username.isBlank() && !user.getUsername().toLowerCase().contains(username.toLowerCase())) {
                    matches = false;
                }
                if (department != null && !department.isBlank() && (user.getDepartment() == null || !user.getDepartment().getName().toLowerCase().contains(department.toLowerCase()))) {
                    matches = false;
                }
                if (role != null && !role.isBlank() && (user.getRoles().stream().noneMatch(r -> r.getName().name().equalsIgnoreCase(role)))) {
                    matches = false;
                }
                if (matches) {
                    return new org.springframework.data.domain.PageImpl<>(List.of(mapUserToResponse(user)), pageable, 1);
                } else {
                    return new org.springframework.data.domain.PageImpl<>(Collections.emptyList(), pageable, 0);
                }
            } else {
                return new org.springframework.data.domain.PageImpl<>(Collections.emptyList(), pageable, 0);
            }
        }
        if (username != null && !username.isBlank()) {
            builder.and(qUser.username.containsIgnoreCase(username));
        }
        if (department != null && !department.isBlank()) {
            builder.and(qUser.department.name.containsIgnoreCase(department));
        }
        if (role != null && !role.isBlank()) {
            builder.and(qUser.roles.any().name.stringValue().equalsIgnoreCase(role));
        }
        Page<User> page = userRepository.findAll(builder, pageable);
        return page.map(this::mapUserToResponse);
    }
}
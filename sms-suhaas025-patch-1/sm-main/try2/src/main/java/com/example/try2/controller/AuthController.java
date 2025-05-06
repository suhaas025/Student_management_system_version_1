package com.example.try2.controller;

import com.example.try2.entity.ERole;
import com.example.try2.entity.Role;
import com.example.try2.entity.User;
import com.example.try2.payload.request.CreateModeratorRequest;
import com.example.try2.payload.request.CreateUserRequest;
import com.example.try2.payload.request.LoginRequest;
import com.example.try2.payload.request.SignupRequest;
import com.example.try2.payload.request.ChangePasswordRequest;
import com.example.try2.payload.request.ForgotPasswordRequest;
import com.example.try2.payload.request.ForgotPasswordMfaVerifyRequest;
import com.example.try2.payload.request.ForgotPasswordResetRequest;
import com.example.try2.payload.response.JwtResponse;
import com.example.try2.payload.response.MessageResponse;
import com.example.try2.payload.response.MfaCheckResponse;
import com.example.try2.repository.RoleRepository;
import com.example.try2.repository.UserRepository;
import com.example.try2.security.jwt.JwtUtils;
import com.example.try2.security.services.UserDetailsImpl;
import com.example.try2.service.UserService;
import com.example.try2.security.services.MfaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.example.try2.security.jwt.TokenBlacklistService;
import com.example.try2.service.ActivityLogService;
import com.example.try2.entity.Department;
import com.example.try2.repository.DepartmentRepository;
import com.example.try2.service.AccountManagementService;
import com.example.try2.entity.EAccountStatus;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @Autowired
    UserService userService;

    @Autowired
    MfaService mfaService;

    @Autowired
    private TokenBlacklistService tokenBlacklistService;

    @Autowired
    private ActivityLogService activityLogService;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private AccountManagementService accountManagementService;

    // In-memory password reset service (for demo/dev)
    private static final UserService.PasswordResetService passwordResetService = new UserService.PasswordResetService();

    // Simple in-memory rate limiter (per IP, for demo)
    private static final java.util.Map<String, Long> lastRequestTime = new java.util.concurrent.ConcurrentHashMap<>();
    private static final long RATE_LIMIT_WINDOW_MS = 5000; // 5 seconds per request per IP

    private boolean isRateLimited(String ip) {
        long now = System.currentTimeMillis();
        Long last = lastRequestTime.get(ip);
        if (last != null && now - last < RATE_LIMIT_WINDOW_MS) {
            return true;
        }
        lastRequestTime.put(ip, now);
        return false;
    }

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        User user = userRepository.findByUsername(loginRequest.getUsername()).orElse(null);
        Boolean force = loginRequest.getForce();
        if (force == null) force = false;
        System.out.println("LoginRequest: username=" + loginRequest.getUsername() + ", force=" + force);
        
        // Check if user exists
        if (user == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid username or password"));
        }
        
        // Check account status
        if (user.getAccountStatus() == EAccountStatus.BLOCKED) {
            return ResponseEntity.badRequest().body(new MessageResponse("Your account is blocked. Please contact an administrator."));
        }
        
        if (user.getAccountStatus() == EAccountStatus.EXPIRED) {
            return ResponseEntity.badRequest().body(new MessageResponse("Your account has expired due to inactivity. Please contact an administrator."));
        }
        
        // Only check for already logged in if force is false
        if (!force && user != null && user.getCurrentJwt() != null && !user.getCurrentJwt().isEmpty()) {
            try {
                if (jwtUtils.validateJwtToken(user.getCurrentJwt())) {
                    System.out.println("Already logged in detected for user: " + loginRequest.getUsername());
                    return ResponseEntity.ok(java.util.Map.of(
                        "alreadyLoggedIn", true,
                        "message", "You are already logged in elsewhere. If you continue, your old session will be terminated."
                    ));
                } else {
                    // If the token is not valid, clear it and continue
                    user.setCurrentJwt(null);
                    userRepository.save(user);
                }
            } catch (Exception e) {
                // If token is malformed or causes an error, clear it and continue
                user.setCurrentJwt(null);
                userRepository.save(user);
            }
        }
        if (user != null) {
            // Check if account is locked
            if (user.getAccountLockedUntil() != null) {
                long now = System.currentTimeMillis();
                if (now < user.getAccountLockedUntil()) {
                    long secondsLeft = (user.getAccountLockedUntil() - now) / 1000;
                    return ResponseEntity.badRequest().body(new MessageResponse(
                        "Account is locked due to too many failed login attempts. Please try again in " + secondsLeft + " seconds."));
                } else {
                    // Unlock account
                    user.setAccountLockedUntil(null);
                    user.setFailedLoginAttempts(0);
                    userRepository.save(user);
                }
            }
        }
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);

            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            User userEntity = userRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Reset failed attempts and lock status on successful login
            userEntity.setFailedLoginAttempts(0);
            userEntity.setAccountLockedUntil(null);
            
            // Record login and update expiration date
            accountManagementService.recordUserLogin(userEntity.getId());
            
            // Log successful login
            activityLogService.logAction(userEntity.getId(), userEntity.getUsername(), "LOGIN", "User logged in");

            // If MFA is enabled, return a temporary token
            if (userEntity.isMfaEnabled()) {
                String tempToken = jwtUtils.generateMfaToken(userDetails.getUsername(), userDetails.getId());
                System.out.println("MFA required for user: " + loginRequest.getUsername());
                return ResponseEntity.ok(new MfaCheckResponse(true, tempToken));
            }

            // If MFA is not enabled, generate and return the JWT
            String jwt = jwtUtils.generateJwtToken(authentication);
            userEntity.setCurrentJwt(jwt); // Enforce single session
            userRepository.save(userEntity);
            System.out.println("Proceeding to authenticate and return JWT for user: " + loginRequest.getUsername());
            List<String> roles = userDetails.getAuthorities().stream()
                    .map(item -> item.getAuthority())
                    .collect(Collectors.toList());

            return ResponseEntity.ok(new JwtResponse(jwt,
                    userDetails.getId(),
                    userDetails.getUsername(),
                    userDetails.getEmail(),
                    userEntity.getAvatar(),
                    roles));
        } catch (Exception ex) {
            // On failed authentication, increment failed attempts
            if (user != null) {
                int attempts = user.getFailedLoginAttempts() + 1;
                logger.warn("Failed login attempt {} for user {}", attempts, user.getUsername());
                user.setFailedLoginAttempts(attempts);
                if (attempts >= 5) {
                    user.setAccountLockedUntil(System.currentTimeMillis() + 60_000); // lock for 1 minute
                    userRepository.save(user);
                    logger.warn("Account locked for user {} after 5 failed attempts", user.getUsername());
                    return ResponseEntity.badRequest().body(new MessageResponse(
                        "Account locked after 5 failed login attempts. Please try again in 60 seconds."));
                } else {
                    userRepository.save(user);
                }
            }
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid username or password"));
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        logger.info("Processing signup request for username: {}", signUpRequest.getUsername());
        logger.info("Requested roles: {}", signUpRequest.getRole());
        
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Username is already taken!"));
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        // Create new user's account
        User user = new User(signUpRequest.getUsername(),
                signUpRequest.getEmail(),
                encoder.encode(signUpRequest.getPassword()));

        Set<String> strRoles = signUpRequest.getRole();
        Set<Role> roles = new HashSet<>();
        
        // Track if ROLE_USER was added as a fallback
        final java.util.concurrent.atomic.AtomicBoolean addedUserAsFallback = new java.util.concurrent.atomic.AtomicBoolean(false);

        if (strRoles == null || strRoles.isEmpty()) {
            logger.info("No roles specified, assigning default ROLE_USER");
            Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                    .orElseThrow(() -> new RuntimeException("Error: Role USER is not found."));
            roles.add(userRole);
        } else {
            logger.info("Processing {} role(s)", strRoles.size());
            strRoles.forEach(role -> {
                logger.info("Processing role: '{}'", role);
                
                // Convert to lowercase and trim for consistent comparison
                String roleLower = role.toLowerCase().trim();
                
                switch (roleLower) {
                    case "admin":
                        Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                                .orElseThrow(() -> new RuntimeException("Error: Role ADMIN is not found."));
                        roles.add(adminRole);
                        logger.info("Added ROLE_ADMIN");
                        break;
                    case "mod":
                    case "moderator":
                        Role modRole = roleRepository.findByName(ERole.ROLE_MODERATOR)
                                .orElseThrow(() -> new RuntimeException("Error: Role MODERATOR is not found."));
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
                                    .orElseThrow(() -> new RuntimeException("Error: Role USER is not found."));
                            roles.add(userRole);
                            addedUserAsFallback.set(true); // Mark that we added USER as a fallback
                            logger.info("Added ROLE_USER (as fallback for student)");
                        }
                        break;
                    case "user":
                        Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                                .orElseThrow(() -> new RuntimeException("Error: Role USER is not found."));
                        roles.add(userRole);
                        logger.info("Added ROLE_USER");
                        break;
                    default:
                        logger.warn("Unknown role: '{}', adding default ROLE_USER", role);
                        Role defaultRole = roleRepository.findByName(ERole.ROLE_USER)
                                .orElseThrow(() -> new RuntimeException("Error: Role USER is not found."));
                        roles.add(defaultRole);
                        logger.info("Added ROLE_USER (default)");
                }
            });
        }

        // Make sure we don't accidentally add ROLE_USER when other roles are specified
        if (roles.size() > 0 && !strRoles.contains("user") && !addedUserAsFallback.get()) {
            // Only remove ROLE_USER if we have other roles and we didn't add it as a fallback
            boolean hasNonUserRole = roles.stream()
                    .anyMatch(role -> role.getName() != ERole.ROLE_USER);
            
            if (hasNonUserRole) {
                roles.removeIf(role -> role.getName() == ERole.ROLE_USER);
                logger.info("Removed default ROLE_USER since other roles were specified");
            }
        }

        user.setRoles(roles);
        userRepository.save(user);
        
        // Log the final roles
        logger.info("User created with {} roles: {}", roles.size(), 
                roles.stream().map(r -> r.getName().name()).collect(Collectors.joining(", ")));

        return ResponseEntity.ok(new MessageResponse("User registered successfully with roles: " + 
                roles.stream().map(r -> r.getName().name()).collect(Collectors.joining(", "))));
    }

    @PostMapping("/create-user")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserRequest createUserRequest) {
        if (userRepository.existsByUsername(createUserRequest.getUsername())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Username is already taken!"));
        }

        if (userRepository.existsByEmail(createUserRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        // Create new user's account
        User user = new User(
            createUserRequest.getUsername(),
            createUserRequest.getEmail(),
            encoder.encode(createUserRequest.getPassword())
        );
        user.setDegree(createUserRequest.getDegree());
        user.setYearOfStudy(createUserRequest.getYearOfStudy());
        if (createUserRequest.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(createUserRequest.getDepartmentId())
                .orElseThrow(() -> new RuntimeException("Department not found"));
            user.setDepartment(dept);
        }

        Set<String> strRoles = createUserRequest.getRole();
        Set<Role> roles = new HashSet<>();
        
        // Track if ROLE_USER was added as a fallback
        final java.util.concurrent.atomic.AtomicBoolean addedUserAsFallback = new java.util.concurrent.atomic.AtomicBoolean(false);

        if (strRoles == null || strRoles.isEmpty()) {
            Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                    .orElseThrow(() -> new RuntimeException("Error: ROLE_USER not found."));
            roles.add(userRole);
            logger.info("No roles specified, added default ROLE_USER");
        } else {
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

        user.setRoles(roles);
        userRepository.save(user);
        
        logger.info("User created with {} roles: {}", roles.size(), 
                roles.stream().map(r -> r.getName().name()).collect(Collectors.joining(", ")));

        return ResponseEntity.ok(new MessageResponse("User created successfully! Credentials: " + 
                "Username: " + createUserRequest.getUsername() + 
                ", Password: " + createUserRequest.getPassword() +
                ", Degree: " + createUserRequest.getDegree() +
                ", DepartmentId: " + createUserRequest.getDepartmentId() +
                ", Year: " + createUserRequest.getYearOfStudy() +
                ", Roles: " + roles.stream().map(r -> r.getName().name()).collect(Collectors.joining(", "))));
    }

    @PostMapping("/create-moderator")
    public ResponseEntity<?> createModerator(@Valid @RequestBody CreateModeratorRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Username is already taken!"));
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        User user = new User(request.getUsername(),
                request.getEmail(),
                encoder.encode(request.getPassword()));

        // Set moderator-specific fields based on type
        user.setModeratorType(request.getModeratorType());
        switch (request.getModeratorType()) {
            case TEACHER:
                if (request.getDepartmentId() != null) {
                    Department dept = departmentRepository.findById(request.getDepartmentId())
                        .orElseThrow(() -> new RuntimeException("Department not found"));
                    user.setDepartment(dept);
                }
                user.setSpecialization(request.getSpecialization());
                break;
            case HOSTEL_WARDEN:
                user.setHostelName(request.getHostelName());
                break;
            case LIBRARIAN:
                user.setLibrarySection(request.getLibrarySection());
                break;
            case LAB_INCHARGE:
                user.setLabName(request.getLabName());
                break;
            case SPORTS_COORDINATOR:
                user.setSportsCategory(request.getSportsCategory());
                break;
            case CULTURAL_COORDINATOR:
                user.setCulturalCategory(request.getCulturalCategory());
                break;
            case ACADEMIC_COORDINATOR:
                user.setAcademicProgram(request.getAcademicProgram());
                break;
        }

        // Always add the moderator role
        Set<Role> roles = new HashSet<>();
        Role modRole = roleRepository.findByName(ERole.ROLE_MODERATOR)
                .orElseThrow(() -> new RuntimeException("Error: ROLE_MODERATOR not found."));
        roles.add(modRole);
        logger.info("Added ROLE_MODERATOR");
        
        // Track if ROLE_USER was added as a fallback
        final java.util.concurrent.atomic.AtomicBoolean addedUserAsFallback = new java.util.concurrent.atomic.AtomicBoolean(false);
        
        // Also add any additional roles that were specified
        if (request.getAdditionalRoles() != null && !request.getAdditionalRoles().isEmpty()) {
            request.getAdditionalRoles().forEach(roleStr -> {
                String roleLower = roleStr.toLowerCase().trim();
                logger.info("Processing additional role: '{}'", roleLower);
                
                switch (roleLower) {
                    case "admin":
                        Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                                .orElseThrow(() -> new RuntimeException("Error: ROLE_ADMIN not found."));
                        roles.add(adminRole);
                        logger.info("Added ROLE_ADMIN");
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
                }
            });
        }

        user.setRoles(roles);
        userRepository.save(user);
        
        logger.info("Moderator created with {} roles: {}", roles.size(), 
                roles.stream().map(r -> r.getName().name()).collect(Collectors.joining(", ")));

        return ResponseEntity.ok(new MessageResponse("Moderator created successfully with roles: " + 
                roles.stream().map(r -> r.getName().name()).collect(Collectors.joining(", "))));
    }

    @PostMapping("/change-password")
    @PreAuthorize("hasRole('USER') or hasRole('MODERATOR') or hasRole('ADMIN')")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify current password
        if (!encoder.matches(request.getCurrentPassword(), user.getPassword())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Current password is incorrect!"));
        }

        // Update password
        user.setPassword(encoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("Password changed successfully!"));
    }

    // --- Forgot Password with MFA ---
    @PostMapping("/forgot-password/request-mfa")
    public ResponseEntity<?> requestForgotPasswordMfa(@Valid @RequestBody ForgotPasswordRequest request, HttpServletRequest httpReq) {
        String ip = httpReq.getRemoteAddr();
        if (isRateLimited(ip)) {
            logger.warn("Rate limit exceeded for /forgot-password/request-mfa from IP: {}", ip);
            return ResponseEntity.status(429).body(new MessageResponse("Too many requests. Please wait and try again."));
        }
        User user = userRepository.findByUsername(request.getUsername())
                .orElse(null);
        if (user == null) {
            logger.warn("Forgot password request for non-existent user: {} from IP: {}", request.getUsername(), ip);
            return ResponseEntity.badRequest().body(new MessageResponse("User not found"));
        }
        if (!user.isMfaEnabled()) {
            // Instead of issuing a reset token, require MFA setup
            logger.info("Forgot password (no MFA) - require MFA setup for user: {} from IP: {}", request.getUsername(), ip);
            return ResponseEntity.ok(java.util.Collections.singletonMap("mfaSetupRequired", true));
        }
        logger.info("Forgot password MFA request for user: {} from IP: {}", request.getUsername(), ip);
        return ResponseEntity.ok(new MessageResponse("MFA required. Please enter your authenticator code."));
    }

    @PostMapping("/forgot-password/verify-mfa")
    public ResponseEntity<?> verifyForgotPasswordMfa(@Valid @RequestBody ForgotPasswordMfaVerifyRequest request, HttpServletRequest httpReq) {
        String ip = httpReq.getRemoteAddr();
        if (isRateLimited(ip)) {
            logger.warn("Rate limit exceeded for /forgot-password/verify-mfa from IP: {}", ip);
            return ResponseEntity.status(429).body(new MessageResponse("Too many requests. Please wait and try again."));
        }
        User user = userRepository.findByUsername(request.getUsername())
                .orElse(null);
        if (user == null) {
            logger.warn("MFA verify for non-existent user: {} from IP: {}", request.getUsername(), ip);
            return ResponseEntity.badRequest().body(new MessageResponse("User not found"));
        }
        if (!user.isMfaEnabled()) {
            logger.warn("MFA verify called for user without MFA: {} from IP: {}", request.getUsername(), ip);
            return ResponseEntity.badRequest().body(new MessageResponse("MFA is not enabled for this user"));
        }
        boolean mfaValid = mfaService.verifyCode(user, request.getCode()) || mfaService.verifyAndConsumeBackupCode(user, request.getCode());
        if (!mfaValid) {
            logger.warn("Invalid MFA code for user: {} from IP: {}", request.getUsername(), ip);
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid MFA code"));
        }
        String resetToken = passwordResetService.createToken(user.getUsername());
        logger.info("MFA verified and reset token issued for user: {} from IP: {}", request.getUsername(), ip);
        return ResponseEntity.ok(java.util.Collections.singletonMap("token", resetToken));
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<?> resetForgotPassword(@Valid @RequestBody ForgotPasswordResetRequest request, HttpServletRequest httpReq) {
        String ip = httpReq.getRemoteAddr();
        if (isRateLimited(ip)) {
            logger.warn("Rate limit exceeded for /forgot-password/reset from IP: {}", ip);
            return ResponseEntity.status(429).body(new MessageResponse("Too many requests. Please wait and try again."));
        }
        User user = userRepository.findByUsername(request.getUsername())
                .orElse(null);
        if (user == null) {
            logger.warn("Password reset for non-existent user: {} from IP: {}", request.getUsername(), ip);
            return ResponseEntity.badRequest().body(new MessageResponse("User not found"));
        }
        boolean tokenValid = passwordResetService.validateToken(user.getUsername(), request.getToken());
        if (!tokenValid) {
            logger.warn("Invalid or expired reset token for user: {} from IP: {}", request.getUsername(), ip);
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid or expired reset token"));
        }
        user.setPassword(encoder.encode(request.getNewPassword()));
        userRepository.save(user);
        passwordResetService.invalidateToken(request.getToken());
        logger.info("Password reset successful for user: {} from IP: {}", request.getUsername(), ip);
        return ResponseEntity.ok(new MessageResponse("Password reset successfully!"));
    }

    // --- New: Setup MFA for forgot password (unauthenticated) ---
    @PostMapping("/forgot-password/setup-mfa")
    public ResponseEntity<?> setupMfaForForgotPassword(@RequestBody ForgotPasswordRequest request) {
        User user = userRepository.findByUsername(request.getUsername()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("User not found"));
        }
        // Generate a new secret and QR code URL
        String secret = mfaService.generateMfaSecret(user);
        String appName = "LMS";
        String qrCodeUrl = mfaService.generateQrCodeUrl(user.getUsername(), secret, appName);
        // Optionally, generate backup codes
        java.util.Set<String> backupCodes = mfaService.generateBackupCodes(user);
        return ResponseEntity.ok(java.util.Map.of(
            "secretKey", secret,
            "qrCodeUrl", qrCodeUrl,
            "backupCodes", backupCodes
        ));
    }

    // --- New: Verify MFA setup for forgot password (unauthenticated) ---
    @PostMapping("/forgot-password/verify-mfa-setup")
    public ResponseEntity<?> verifyMfaSetupForForgotPassword(@RequestBody ForgotPasswordMfaVerifyRequest request) {
        User user = userRepository.findByUsername(request.getUsername()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("User not found"));
        }
        boolean mfaValid = mfaService.verifyCode(user, request.getCode());
        if (!mfaValid) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid MFA code"));
        }
        // Enable MFA for the user
        mfaService.enableMfa(user, true);
        // Issue a reset token
        String resetToken = passwordResetService.createToken(user.getUsername());
        return ResponseEntity.ok(java.util.Collections.singletonMap("token", resetToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader("Authorization") String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            // Find the user by currentJwt and clear it
            User user = userRepository.findByCurrentJwt(token).orElse(null);
            if (user != null) {
                user.setCurrentJwt(null);
                userRepository.save(user);
                // Log logout
                activityLogService.logAction(user.getId(), user.getUsername(), "LOGOUT", "User logged out");
            }
            tokenBlacklistService.blacklistToken(token);
            return ResponseEntity.ok(new MessageResponse("Logged out successfully."));
        }
        return ResponseEntity.badRequest().body(new MessageResponse("No token provided."));
    }
} 
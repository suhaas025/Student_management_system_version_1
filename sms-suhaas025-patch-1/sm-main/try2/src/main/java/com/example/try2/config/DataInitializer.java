package com.example.try2.config;

import com.example.try2.entity.ERole;
import com.example.try2.entity.Role;
import com.example.try2.entity.User;
import com.example.try2.repository.RoleRepository;
import com.example.try2.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.HashSet;
import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        logger.info("Initializing default roles and users...");
        
        // Create roles if they don't exist
        Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                .orElseGet(() -> {
                    Role role = new Role(ERole.ROLE_ADMIN);
                    logger.info("Creating ADMIN role");
                    return roleRepository.save(role);
                });

        Role modRole = roleRepository.findByName(ERole.ROLE_MODERATOR)
                .orElseGet(() -> {
                    Role role = new Role(ERole.ROLE_MODERATOR);
                    logger.info("Creating MODERATOR role");
                    return roleRepository.save(role);
                });

        Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                .orElseGet(() -> {
                    Role role = new Role(ERole.ROLE_USER);
                    logger.info("Creating USER role");
                    return roleRepository.save(role);
                });

        // Create admin user if it doesn't exist
        String adminUsername = "admin";
        String adminEmail = "admin@example.com";
        if (!userRepository.existsByUsername(adminUsername) && !userRepository.existsByEmail(adminEmail)) {
            logger.info("Creating admin user");
            User admin = new User(
                adminUsername,
                adminEmail,
                passwordEncoder.encode("admin123")
            );
            Set<Role> roles = new HashSet<>();
            roles.add(adminRole);
            admin.setRoles(roles);
            userRepository.save(admin);
            logger.info("Admin user created successfully");
        } else {
            logger.info("Admin user already exists");
        }

        // Create moderator user if it doesn't exist
        String modUsername = "moderator";
        String modEmail = "moderator@example.com";
        if (!userRepository.existsByUsername(modUsername) && !userRepository.existsByEmail(modEmail)) {
            logger.info("Creating moderator user");
            User moderator = new User(
                modUsername,
                modEmail,
                passwordEncoder.encode("mod123")
            );
            Set<Role> roles = new HashSet<>();
            roles.add(modRole);
            moderator.setRoles(roles);
            userRepository.save(moderator);
            logger.info("Moderator user created successfully");
        } else {
            logger.info("Moderator user already exists");
        }
    }
} 
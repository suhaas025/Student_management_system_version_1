package com.example.try2.repository;

import com.example.try2.entity.EModeratorType;
import com.example.try2.entity.ERole;
import com.example.try2.entity.EAccountStatus;
import com.example.try2.entity.Role;
import com.example.try2.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, QuerydslPredicateExecutor<User> {
    Optional<User> findByUsername(String username);
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);
    List<User> findByRoles_Name(ERole name);
    long countByRoles_Name(ERole name);
    List<User> findByRolesContaining(Role role);
    List<User> findByRolesContainingAndModeratorType(Role role, EModeratorType moderatorType);
    List<User> findByModeratorType(EModeratorType moderatorType);
    Optional<User> findByCurrentJwt(String currentJwt);
    Optional<User> findByEmail(String email);
    
    // Account expiration methods
    List<User> findByAccountExpirationDateBeforeAndAccountStatusNot(LocalDateTime expirationDate, EAccountStatus accountStatus);
}
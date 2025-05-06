package com.example.try2.repository;

import com.example.try2.entity.UserDashboardPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserDashboardPreferenceRepository extends JpaRepository<UserDashboardPreference, Long> {
    Optional<UserDashboardPreference> findByUserId(String userId);
} 
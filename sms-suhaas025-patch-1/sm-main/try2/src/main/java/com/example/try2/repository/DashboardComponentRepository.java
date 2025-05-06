package com.example.try2.repository;

import com.example.try2.entity.DashboardComponent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;

@Repository
public interface DashboardComponentRepository extends JpaRepository<DashboardComponent, Long> {
    List<DashboardComponent> findByAllowedRolesInAndVisibleIsTrue(Set<String> roles);
    List<DashboardComponent> findByParentId(Long parentId);
    List<DashboardComponent> findByVisibleIsTrueOrderByDisplayOrderAsc();
} 
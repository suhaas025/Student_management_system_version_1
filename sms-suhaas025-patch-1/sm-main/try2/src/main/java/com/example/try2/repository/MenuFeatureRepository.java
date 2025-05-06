package com.example.try2.repository;

import com.example.try2.entity.MenuFeature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;

@Repository
public interface MenuFeatureRepository extends JpaRepository<MenuFeature, Long> {
    List<MenuFeature> findByAllowedRoles_NameInAndVisibleIsTrue(Set<String> roleNames);
    List<MenuFeature> findByVisibleIsTrue();
    boolean existsByName(String name);
    boolean existsByUri(String uri);
} 
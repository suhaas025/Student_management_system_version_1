package com.example.try2.controller;

import com.example.try2.payload.request.MenuFeatureRequest;
import com.example.try2.payload.response.MenuFeatureResponse;
import com.example.try2.service.MenuFeatureService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/menu-features")
public class MenuFeatureController {
    @Autowired
    private MenuFeatureService menuFeatureService;

    // List all features (ADMIN only)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<MenuFeatureResponse> getAllMenuFeatures() {
        return menuFeatureService.getAllMenuFeatures();
    }

    // Get single feature (ADMIN only)
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MenuFeatureResponse> getMenuFeature(@PathVariable Long id) {
        MenuFeatureResponse resp = menuFeatureService.getMenuFeature(id);
        return resp != null ? ResponseEntity.ok(resp) : ResponseEntity.notFound().build();
    }

    // Create feature (ADMIN only)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public MenuFeatureResponse createMenuFeature(@RequestBody MenuFeatureRequest req) {
        return menuFeatureService.createMenuFeature(req);
    }

    // Update feature (ADMIN only)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public MenuFeatureResponse updateMenuFeature(@PathVariable Long id, @RequestBody MenuFeatureRequest req) {
        return menuFeatureService.updateMenuFeature(id, req);
    }

    // Delete feature (ADMIN only)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteMenuFeature(@PathVariable Long id) {
        menuFeatureService.deleteMenuFeature(id);
        return ResponseEntity.ok().build();
    }

    // Get features for current user's roles (for menu rendering)
    @PostMapping("/for-roles")
    public List<MenuFeatureResponse> getMenuFeaturesForRoles(@RequestBody Set<String> roles) {
        return menuFeatureService.getMenuFeaturesForRoles(roles);
    }
} 
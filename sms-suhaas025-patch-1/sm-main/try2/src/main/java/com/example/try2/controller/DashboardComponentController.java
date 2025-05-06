package com.example.try2.controller;

import com.example.try2.payload.request.DashboardComponentRequest;
import com.example.try2.payload.response.DashboardComponentResponse;
import com.example.try2.service.DashboardComponentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/dashboard-components")
public class DashboardComponentController {
    @Autowired
    private DashboardComponentService service;

    // List all components (ADMIN only)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<DashboardComponentResponse> getAll() {
        return service.getAll();
    }

    // Get single component (ADMIN only)
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DashboardComponentResponse> getById(@PathVariable Long id) {
        DashboardComponentResponse resp = service.getById(id);
        return resp != null ? ResponseEntity.ok(resp) : ResponseEntity.notFound().build();
    }

    // Create component (ADMIN only)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public DashboardComponentResponse create(@RequestBody DashboardComponentRequest req) {
        return service.create(req);
    }

    // Update component (ADMIN only)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public DashboardComponentResponse update(@PathVariable Long id, @RequestBody DashboardComponentRequest req) {
        return service.update(id, req);
    }

    // Delete component (ADMIN only)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }

    // Get components for current user's roles (for dashboard rendering)
    @PostMapping("/for-roles")
    public List<DashboardComponentResponse> getForRoles(@RequestBody Set<String> roles) {
        return service.getForRoles(roles);
    }

    // Get components by parentId (for nested menus)
    @GetMapping("/by-parent/{parentId}")
    public List<DashboardComponentResponse> getByParentId(@PathVariable Long parentId) {
        return service.getByParentId(parentId);
    }

    // Reorder components (ADMIN only)
    @PatchMapping("/reorder")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> reorder(@RequestBody List<Long> orderedIds) {
        service.reorder(orderedIds);
        return ResponseEntity.ok().build();
    }
} 
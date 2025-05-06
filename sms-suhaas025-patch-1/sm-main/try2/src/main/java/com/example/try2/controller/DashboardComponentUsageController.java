package com.example.try2.controller;

import com.example.try2.entity.DashboardComponentUsage;
import com.example.try2.payload.request.DashboardComponentUsageRequest;
import com.example.try2.payload.response.DashboardComponentUsageResponse;
import com.example.try2.service.DashboardComponentUsageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard-components/usage")
public class DashboardComponentUsageController {
    @Autowired
    private DashboardComponentUsageService service;

    @PostMapping
    public ResponseEntity<DashboardComponentUsageResponse> logUsage(@RequestBody DashboardComponentUsageRequest req) {
        DashboardComponentUsage usage = new DashboardComponentUsage();
        usage.setUserId(req.getUserId());
        usage.setComponentId(req.getComponentId());
        usage.setAction(req.getAction());
        usage.setMetadataJson(req.getMetadataJson());
        DashboardComponentUsage saved = service.logUsage(usage);
        return ResponseEntity.ok(toResponse(saved));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public List<DashboardComponentUsageResponse> getStats(
            @RequestParam(required = false) Long componentId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end
    ) {
        if (componentId != null) {
            return service.getUsageByComponent(componentId, start, end).stream().map(this::toResponse).collect(Collectors.toList());
        } else if (userId != null) {
            return service.getUsageByUser(userId, start, end).stream().map(this::toResponse).collect(Collectors.toList());
        } else {
            // Return all usage if no filter
            return service.getUsageByComponent(null, null, null).stream().map(this::toResponse).collect(Collectors.toList());
        }
    }

    private DashboardComponentUsageResponse toResponse(DashboardComponentUsage usage) {
        DashboardComponentUsageResponse resp = new DashboardComponentUsageResponse();
        resp.setId(usage.getId());
        resp.setUserId(usage.getUserId());
        resp.setComponentId(usage.getComponentId());
        resp.setAction(usage.getAction());
        resp.setMetadataJson(usage.getMetadataJson());
        resp.setTimestamp(usage.getTimestamp());
        return resp;
    }
} 
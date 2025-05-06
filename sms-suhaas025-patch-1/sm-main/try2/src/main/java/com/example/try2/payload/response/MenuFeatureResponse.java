package com.example.try2.payload.response;

import java.time.LocalDateTime;
import java.util.Set;

public class MenuFeatureResponse {
    private Long id;
    private String name;
    private String uri;
    private boolean visible;
    private Set<String> allowedRoles;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getUri() { return uri; }
    public void setUri(String uri) { this.uri = uri; }
    public boolean isVisible() { return visible; }
    public void setVisible(boolean visible) { this.visible = visible; }
    public Set<String> getAllowedRoles() { return allowedRoles; }
    public void setAllowedRoles(Set<String> allowedRoles) { this.allowedRoles = allowedRoles; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
} 
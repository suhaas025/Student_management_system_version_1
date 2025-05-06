package com.example.try2.payload.response;

import java.time.LocalDateTime;
import java.util.Set;

public class DashboardComponentResponse {
    private Long id;
    private String title;
    private String description;
    private String icon;
    private Integer displayOrder;
    private boolean visible;
    private Set<String> allowedRoles;
    private String frontendRoute;
    private String backendEndpoint;
    private String componentType;
    private String configJson;
    private Long parentId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String themeJson;
    private String permissionsJson;
    private String translationsJson;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
    public boolean isVisible() { return visible; }
    public void setVisible(boolean visible) { this.visible = visible; }
    public Set<String> getAllowedRoles() { return allowedRoles; }
    public void setAllowedRoles(Set<String> allowedRoles) { this.allowedRoles = allowedRoles; }
    public String getFrontendRoute() { return frontendRoute; }
    public void setFrontendRoute(String frontendRoute) { this.frontendRoute = frontendRoute; }
    public String getBackendEndpoint() { return backendEndpoint; }
    public void setBackendEndpoint(String backendEndpoint) { this.backendEndpoint = backendEndpoint; }
    public String getComponentType() { return componentType; }
    public void setComponentType(String componentType) { this.componentType = componentType; }
    public String getConfigJson() { return configJson; }
    public void setConfigJson(String configJson) { this.configJson = configJson; }
    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public String getThemeJson() { return themeJson; }
    public void setThemeJson(String themeJson) { this.themeJson = themeJson; }
    public String getPermissionsJson() { return permissionsJson; }
    public void setPermissionsJson(String permissionsJson) { this.permissionsJson = permissionsJson; }
    public String getTranslationsJson() { return translationsJson; }
    public void setTranslationsJson(String translationsJson) { this.translationsJson = translationsJson; }
} 
package com.example.try2.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "dashboard_components")
public class DashboardComponent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;

    private String icon;

    @Column(name = "display_order")
    private Integer displayOrder;

    private boolean visible = true;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "component_roles", joinColumns = @JoinColumn(name = "component_id"))
    @Column(name = "role")
    private Set<String> allowedRoles = new HashSet<>();

    private String frontendRoute;
    private String backendEndpoint;

    @Column(name = "component_type")
    private String componentType;

    @Lob
    private String configJson;

    @Lob
    private String themeJson; // For per-component theming/styling

    @Lob
    private String permissionsJson; // For fine-grained permissions

    @Lob
    private String translationsJson; // For i18n/localization

    private Long parentId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

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
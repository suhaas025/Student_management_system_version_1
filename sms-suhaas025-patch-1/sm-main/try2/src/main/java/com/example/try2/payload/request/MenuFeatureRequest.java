package com.example.try2.payload.request;

import java.util.Set;

public class MenuFeatureRequest {
    private String name;
    private String uri;
    private boolean visible;
    private Set<String> allowedRoles;

    // Getters and setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getUri() { return uri; }
    public void setUri(String uri) { this.uri = uri; }
    public boolean isVisible() { return visible; }
    public void setVisible(boolean visible) { this.visible = visible; }
    public Set<String> getAllowedRoles() { return allowedRoles; }
    public void setAllowedRoles(Set<String> allowedRoles) { this.allowedRoles = allowedRoles; }
} 
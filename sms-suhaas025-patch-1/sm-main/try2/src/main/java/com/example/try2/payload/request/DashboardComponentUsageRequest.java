package com.example.try2.payload.request;

public class DashboardComponentUsageRequest {
    private String userId;
    private Long componentId;
    private String action;
    private String metadataJson;

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public Long getComponentId() { return componentId; }
    public void setComponentId(Long componentId) { this.componentId = componentId; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getMetadataJson() { return metadataJson; }
    public void setMetadataJson(String metadataJson) { this.metadataJson = metadataJson; }
} 
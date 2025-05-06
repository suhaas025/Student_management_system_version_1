package com.example.try2.service;

import com.example.try2.entity.DashboardComponent;
import com.example.try2.payload.request.DashboardComponentRequest;
import com.example.try2.payload.response.DashboardComponentResponse;
import com.example.try2.repository.DashboardComponentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardComponentService {
    @Autowired
    private DashboardComponentRepository repository;

    @Cacheable("dashboardComponents")
    public List<DashboardComponentResponse> getAll() {
        return repository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public DashboardComponentResponse getById(Long id) {
        return repository.findById(id).map(this::toResponse).orElse(null);
    }

    @Transactional
    @CacheEvict(value = "dashboardComponents", allEntries = true)
    public DashboardComponentResponse create(DashboardComponentRequest req) {
        DashboardComponent comp = new DashboardComponent();
        updateEntityFromRequest(comp, req);
        return toResponse(repository.save(comp));
    }

    @Transactional
    @CacheEvict(value = "dashboardComponents", allEntries = true)
    public DashboardComponentResponse update(Long id, DashboardComponentRequest req) {
        DashboardComponent comp = repository.findById(id).orElseThrow();
        updateEntityFromRequest(comp, req);
        return toResponse(repository.save(comp));
    }

    @Transactional
    @CacheEvict(value = "dashboardComponents", allEntries = true)
    public void delete(Long id) {
        repository.deleteById(id);
    }

    @Cacheable("dashboardComponentsForUser")
    public List<DashboardComponentResponse> getForRoles(Set<String> roles) {
        List<DashboardComponent> comps = repository.findByAllowedRolesInAndVisibleIsTrue(roles);
        return comps.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<DashboardComponentResponse> getByParentId(Long parentId) {
        return repository.findByParentId(parentId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "dashboardComponents", allEntries = true)
    public void reorder(List<Long> orderedIds) {
        List<DashboardComponent> comps = repository.findAllById(orderedIds);
        for (int i = 0; i < orderedIds.size(); i++) {
            for (DashboardComponent comp : comps) {
                if (comp.getId().equals(orderedIds.get(i))) {
                    comp.setDisplayOrder(i);
                    repository.save(comp);
                    break;
                }
            }
        }
    }

    private DashboardComponentResponse toResponse(DashboardComponent comp) {
        DashboardComponentResponse resp = new DashboardComponentResponse();
        resp.setId(comp.getId());
        resp.setTitle(comp.getTitle());
        resp.setDescription(comp.getDescription());
        resp.setIcon(comp.getIcon());
        resp.setDisplayOrder(comp.getDisplayOrder());
        resp.setVisible(comp.isVisible());
        resp.setAllowedRoles(comp.getAllowedRoles());
        resp.setFrontendRoute(comp.getFrontendRoute());
        resp.setBackendEndpoint(comp.getBackendEndpoint());
        resp.setComponentType(comp.getComponentType());
        resp.setConfigJson(comp.getConfigJson());
        resp.setParentId(comp.getParentId());
        resp.setCreatedAt(comp.getCreatedAt());
        resp.setUpdatedAt(comp.getUpdatedAt());
        resp.setThemeJson(comp.getThemeJson());
        resp.setPermissionsJson(comp.getPermissionsJson());
        resp.setTranslationsJson(comp.getTranslationsJson());
        return resp;
    }

    private void updateEntityFromRequest(DashboardComponent comp, DashboardComponentRequest req) {
        comp.setTitle(req.getTitle());
        comp.setDescription(req.getDescription());
        comp.setIcon(req.getIcon());
        comp.setDisplayOrder(req.getDisplayOrder());
        comp.setVisible(req.isVisible());
        comp.setAllowedRoles(req.getAllowedRoles());
        comp.setFrontendRoute(req.getFrontendRoute());
        comp.setBackendEndpoint(req.getBackendEndpoint());
        comp.setComponentType(req.getComponentType());
        comp.setConfigJson(req.getConfigJson());
        comp.setParentId(req.getParentId());
        comp.setThemeJson(req.getThemeJson());
        comp.setPermissionsJson(req.getPermissionsJson());
        comp.setTranslationsJson(req.getTranslationsJson());
    }
} 
package com.example.try2.service;

import com.example.try2.entity.MenuFeature;
import com.example.try2.entity.Role;
import com.example.try2.entity.ERole;
import com.example.try2.payload.request.MenuFeatureRequest;
import com.example.try2.payload.response.MenuFeatureResponse;
import com.example.try2.repository.MenuFeatureRepository;
import com.example.try2.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class MenuFeatureService {
    @Autowired
    private MenuFeatureRepository menuFeatureRepository;
    @Autowired
    private RoleRepository roleRepository;

    public List<MenuFeatureResponse> getAllMenuFeatures() {
        return menuFeatureRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public MenuFeatureResponse getMenuFeature(Long id) {
        return menuFeatureRepository.findById(id).map(this::toResponse).orElse(null);
    }

    @Transactional
    public MenuFeatureResponse createMenuFeature(MenuFeatureRequest req) {
        MenuFeature feature = new MenuFeature();
        updateEntityFromRequest(feature, req);
        return toResponse(menuFeatureRepository.save(feature));
    }

    @Transactional
    public MenuFeatureResponse updateMenuFeature(Long id, MenuFeatureRequest req) {
        MenuFeature feature = menuFeatureRepository.findById(id).orElseThrow();
        updateEntityFromRequest(feature, req);
        return toResponse(menuFeatureRepository.save(feature));
    }

    @Transactional
    public void deleteMenuFeature(Long id) {
        menuFeatureRepository.deleteById(id);
    }

    public List<MenuFeatureResponse> getMenuFeaturesForRoles(Set<String> roleNames) {
        List<MenuFeature> features = menuFeatureRepository.findByAllowedRoles_NameInAndVisibleIsTrue(roleNames);
        return features.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public MenuFeatureResponse toResponse(MenuFeature feature) {
        MenuFeatureResponse resp = new MenuFeatureResponse();
        resp.setId(feature.getId());
        resp.setName(feature.getName());
        resp.setUri(feature.getUri());
        resp.setVisible(feature.isVisible());
        resp.setAllowedRoles(feature.getAllowedRoles().stream().map(r -> r.getName().name()).collect(Collectors.toSet()));
        resp.setCreatedAt(feature.getCreatedAt());
        resp.setUpdatedAt(feature.getUpdatedAt());
        return resp;
    }

    private void updateEntityFromRequest(MenuFeature feature, MenuFeatureRequest req) {
        feature.setName(req.getName());
        feature.setUri(req.getUri());
        feature.setVisible(req.isVisible());
        Set<ERole> roleEnums = req.getAllowedRoles().stream().map(ERole::valueOf).collect(Collectors.toSet());
        Set<Role> roles = new HashSet<>(roleRepository.findByNameIn(roleEnums));
        feature.setAllowedRoles(roles);
    }
} 
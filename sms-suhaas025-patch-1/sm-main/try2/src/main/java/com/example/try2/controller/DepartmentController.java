package com.example.try2.controller;

import com.example.try2.entity.Department;
import com.example.try2.service.DepartmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/departments")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DepartmentController {
    @Autowired
    private DepartmentService departmentService;

    @GetMapping
    public ResponseEntity<List<Department>> getAllDepartments() {
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }

    @PostMapping
    public ResponseEntity<Department> createDepartment(@RequestBody Department department) {
        if (departmentService.existsByName(department.getName())) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(departmentService.createDepartment(department));
    }

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Integer>> getDepartmentAnalytics() {
        return ResponseEntity.ok(departmentService.getDepartmentStudentCounts());
    }
} 
package com.example.try2.service;

import com.example.try2.entity.Department;
import com.example.try2.repository.DepartmentRepository;
import com.example.try2.repository.UserRepository;
import com.example.try2.entity.User;
import com.example.try2.entity.ERole;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

@Service
public class DepartmentService {
    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    public Department createDepartment(Department department) {
        return departmentRepository.save(department);
    }

    public boolean existsByName(String name) {
        return departmentRepository.existsByName(name);
    }

    public Map<String, Integer> getDepartmentStudentCounts() {
        Map<String, Integer> result = new HashMap<>();
        List<Department> departments = departmentRepository.findAll();
        for (Department dept : departments) {
            // Count users with ROLE_USER and this department
            long count = userRepository.findAll().stream()
                .filter(u -> u.getDepartment() != null &&
                            u.getDepartment().getId().equals(dept.getId()) &&
                            u.getRoles().stream().anyMatch(r -> r.getName().name().equals("ROLE_USER")))
                .count();
            result.put(dept.getName(), (int) count);
        }
        return result;
    }
} 
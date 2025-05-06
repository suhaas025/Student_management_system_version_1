package com.example.try2.controller;

import com.example.try2.entity.Course;
import com.example.try2.entity.User;
import com.example.try2.entity.Department;
import com.example.try2.payload.response.CourseResponse;
import com.example.try2.payload.response.UserResponse;
import com.example.try2.payload.request.UpdateCourseRequest;
import com.example.try2.service.CourseService;
import com.example.try2.service.UserService;
import com.example.try2.service.ActivityLogService;
import com.example.try2.repository.DepartmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.SortDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/courses")
public class CourseController {
    private static final Logger logger = LoggerFactory.getLogger(CourseController.class);

    @Autowired
    private CourseService courseService;

    @Autowired
    private UserService userService;

    @Autowired
    private ActivityLogService activityLogService;

    @Autowired
    private DepartmentRepository departmentRepository;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createCourse(@RequestBody Course course) {
        try {
            logger.info("Creating new course: {}", course);
            logger.info("Academic Year: {}", course.getAcademicYear());

            // Validate required fields
            if (course.getCourseCode() == null || course.getCourseCode().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Course code is required");
            }
            if (course.getCourseName() == null || course.getCourseName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Course name is required");
            }
            if (course.getCredits() == null) {
                return ResponseEntity.badRequest().body("Credits are required");
            }
            if (course.getSemester() == null || course.getSemester().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Semester is required");
            }
            if (course.getAcademicYear() == null || course.getAcademicYear().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Academic year is required");
            }

            // Accept department only by name
            Department department = null;
            if (course.getDepartment() != null && course.getDepartment().getName() != null) {
                department = departmentRepository.findByName(course.getDepartment().getName())
                    .orElse(null);
            }
            if (department == null) {
                return ResponseEntity.badRequest().body("Department name is required and must match an existing department");
            }
            course.setDepartment(department);

            // If teacher is specified, get the User entity from UserService
            if (course.getTeacher() != null) {
                if (course.getTeacher().getId() == null) {
                    return ResponseEntity.badRequest().body("Teacher ID is required if teacher is specified");
                }
                UserResponse teacherResponse = userService.getUserById(course.getTeacher().getId());
                User teacher = userService.getUserFromResponse(teacherResponse);
                course.setTeacher(teacher);
            }

            CourseResponse savedCourse = courseService.saveCourse(course);
            logger.info("Course created with ID: {}, Academic Year: {}", savedCourse.getId(), savedCourse.getAcademicYear());
            // Log course creation
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth != null ? auth.getName() : "unknown";
            User admin = userService.findByUsername(username).orElse(null);
            if (admin != null) {
                activityLogService.logAction(admin.getId(), admin.getUsername(), "COURSE_CREATE", "Created course: " + savedCourse.getCourseName());
            }
            return ResponseEntity.ok(savedCourse);
        } catch (Exception e) {
            logger.error("Error creating course: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Internal Server Error: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<Page<CourseResponse>> getAllCourses(
            @RequestParam(value = "courseCode", required = false) String courseCode,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "department", required = false) String department,
            @RequestParam(value = "teacherId", required = false) Long teacherId,
            @PageableDefault(size = 20) @SortDefault.SortDefaults({
                @SortDefault(sort = "id")
            }) Pageable pageable
    ) {
        return ResponseEntity.ok(courseService.searchCourses(courseCode, title, department, teacherId, pageable));
    }

    @GetMapping("/moderator")
    @PreAuthorize("hasRole('MODERATOR')")
    public ResponseEntity<List<CourseResponse>> getModeratorCourses() {
        // Get the current authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        
        logger.info("Fetching courses for moderator: {}", username);
        
        // Get the moderator's user ID
        User moderator = userService.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found with username: " + username));
        Long moderatorId = moderator.getId();
        
        logger.info("Found moderator with ID: {}", moderatorId);
        
        // Get all courses and filter to those assigned to this moderator
        List<CourseResponse> allCourses = courseService.getAllCourses();
        List<CourseResponse> moderatorCourses = allCourses.stream()
            .filter(course -> course.getTeacher() != null && 
                    course.getTeacher().getId().equals(moderatorId))
            .collect(Collectors.toList());
        
        logger.info("Found {} courses assigned to moderator {}", moderatorCourses.size(), username);
        
        return ResponseEntity.ok(moderatorCourses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseResponse> getCourseById(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getCourseById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CourseResponse> updateCourse(@PathVariable Long id, @RequestBody UpdateCourseRequest updateCourseRequest) {
        logger.info("Updating course with ID: {}", id);
        logger.info("Update request: {}", updateCourseRequest);
        logger.info("Academic Year in update request: {}", updateCourseRequest.getAcademicYear());
        
        CourseResponse updatedCourse = courseService.updateCourse(id, updateCourseRequest);
        logger.info("Course updated - ID: {}, Academic Year: {}", updatedCourse.getId(), updatedCourse.getAcademicYear());
        // Log course update
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : "unknown";
        User admin = userService.findByUsername(username).orElse(null);
        if (admin != null) {
            activityLogService.logAction(admin.getId(), admin.getUsername(), "COURSE_UPDATE", "Updated course: " + updatedCourse.getCourseName());
        }
        return ResponseEntity.ok(updatedCourse);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
        // Log course deletion
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : "unknown";
        User admin = userService.findByUsername(username).orElse(null);
        if (admin != null) {
            activityLogService.logAction(admin.getId(), admin.getUsername(), "COURSE_DELETE", "Deleted course with ID: " + id);
        }
        return ResponseEntity.ok().build();
    }
} 
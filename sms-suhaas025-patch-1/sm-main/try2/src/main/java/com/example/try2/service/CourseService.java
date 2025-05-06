package com.example.try2.service;

import com.example.try2.entity.Course;
import com.example.try2.entity.User;
import com.example.try2.payload.request.UpdateCourseRequest;
import com.example.try2.payload.response.CourseResponse;
import com.example.try2.payload.response.UserResponse;
import com.example.try2.repository.CourseRepository;
import com.example.try2.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.context.SecurityContextHolder;
import com.example.try2.security.services.UserDetailsImpl;
import com.querydsl.core.BooleanBuilder;
import com.example.try2.entity.QCourse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.example.try2.entity.Department;
import com.example.try2.repository.DepartmentRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CourseService {
    private static final Logger logger = LoggerFactory.getLogger(CourseService.class);

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private DepartmentRepository departmentRepository;

    private User getCurrentUser() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public CourseResponse saveCourse(Course course) {
        logger.info("Saving course with teacher ID: {}", course.getTeacher() != null ? course.getTeacher().getId() : "null");
        logger.info("Course details being saved: {}", course);
        logger.info("Academic Year being saved: '{}'", course.getAcademicYear());
        
        if (course.getTeacher() != null && course.getTeacher().getId() != null) {
            UserResponse teacherResponse = userService.getUserById(course.getTeacher().getId());
            User teacher = userService.getUserFromResponse(teacherResponse);
            logger.info("Found teacher: {}", teacher != null ? teacher.getUsername() : "null");
            
            if (teacher == null) {
                throw new RuntimeException("Teacher not found with ID: " + course.getTeacher().getId());
            }
            course.setTeacher(teacher);
        } else {
            throw new RuntimeException("Teacher ID is required");
        }
        
        User currentUser = getCurrentUser();
        course.setCreatedBy(currentUser);
        course.setUpdatedBy(currentUser);
        
        // Set department if departmentId is present (for new course creation)
        if (course.getDepartment() == null && course instanceof com.example.try2.entity.Course) {
            // No-op: department should be set by controller before calling this method
        }
        
        Course savedCourse = courseRepository.save(course);
        logger.info("Saved course details: {}", savedCourse);
        logger.info("Saved course academic year: '{}'", savedCourse.getAcademicYear());
        
        // Force loading of teacher details
        if (savedCourse.getTeacher() != null) {
            savedCourse.getTeacher().getUsername();
            savedCourse.getTeacher().getEmail();
        }
        return convertToCourseResponse(savedCourse);
    }

    public List<CourseResponse> getAllCourses() {
        return courseRepository.findAll()
                .stream()
                .map(this::convertToCourseResponse)
                .collect(Collectors.toList());
    }

    public CourseResponse getCourseById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found with ID: " + id));
        // Force loading of teacher details
        if (course.getTeacher() != null) {
            course.getTeacher().getUsername();
            course.getTeacher().getEmail();
        }
        return convertToCourseResponse(course);
    }
    
    public Course getCourseEntityById(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found with ID: " + id));
    }
    
    public List<CourseResponse> getCoursesByTeacherId(Long teacherId) {
        return courseRepository.findByTeacher_Id(teacherId)
                .stream()
                .map(this::convertToCourseResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Course getCourseByCode(String courseCode) {
        return courseRepository.findByCourseCode(courseCode)
                .orElseThrow(() -> new RuntimeException("Course not found with code: " + courseCode));
    }

    @Transactional
    public CourseResponse updateCourse(Long id, UpdateCourseRequest updateCourseRequest) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found with ID: " + id));

        logger.info("Updating course with ID: {}", id);
        logger.info("Course details before update - academicYear: {}", course.getAcademicYear());
        logger.info("Request contains academicYear: {}", updateCourseRequest.getAcademicYear());

        // Update only the fields that are provided
        if (updateCourseRequest.getCourseCode() != null) {
            course.setCourseCode(updateCourseRequest.getCourseCode());
        }
        if (updateCourseRequest.getCourseName() != null) {
            course.setCourseName(updateCourseRequest.getCourseName());
        }
        if (updateCourseRequest.getDescription() != null) {
            course.setDescription(updateCourseRequest.getDescription());
        }
        if (updateCourseRequest.getCredits() != null) {
            course.setCredits(updateCourseRequest.getCredits());
        }
        if (updateCourseRequest.getSemester() != null) {
            course.setSemester(updateCourseRequest.getSemester());
        }
        if (updateCourseRequest.getAcademicYear() != null) {
            logger.info("Updating academicYear from '{}' to '{}'", course.getAcademicYear(), updateCourseRequest.getAcademicYear());
            course.setAcademicYear(updateCourseRequest.getAcademicYear());
        }
        // ... existing code ...
        if (updateCourseRequest.getDepartmentName() != null && !updateCourseRequest.getDepartmentName().isEmpty()) {
            Department dept = departmentRepository.findByName(updateCourseRequest.getDepartmentName())
                .orElseThrow(() -> new RuntimeException("Department not found with name: " + updateCourseRequest.getDepartmentName()));
            course.setDepartment(dept);
        }
// ... existing code ...

        if (updateCourseRequest.getDepartmentName() != null && !updateCourseRequest.getDepartmentName().isEmpty()) {
    Department dept = departmentRepository.findByName(updateCourseRequest.getDepartmentName())
        .orElseThrow(() -> new RuntimeException("Department not found with name: " + updateCourseRequest.getDepartmentName()));
    course.setDepartment(dept);
}
        if (updateCourseRequest.getTeacherId() != null) {
            User teacher = userRepository.findById(updateCourseRequest.getTeacherId())
                    .orElseThrow(() -> new RuntimeException("Teacher not found with ID: " + updateCourseRequest.getTeacherId()));
            course.setTeacher(teacher);
        }

        User currentUser = getCurrentUser();
        course.setUpdatedBy(currentUser);

        Course updatedCourse = courseRepository.save(course);
        logger.info("Course updated successfully. New academicYear: {}", updatedCourse.getAcademicYear());
        return convertToCourseResponse(updatedCourse);
    }

    public void deleteCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found with ID: " + id));
        courseRepository.delete(course);
    }

    private CourseResponse convertToCourseResponse(Course course) {
        CourseResponse response = new CourseResponse();
        response.setId(course.getId());
        response.setCourseCode(course.getCourseCode());
        response.setCourseName(course.getCourseName());
        response.setDescription(course.getDescription());
        response.setCredits(course.getCredits());
        response.setSemester(course.getSemester());
        response.setAcademicYear(course.getAcademicYear());
        response.setDepartmentName(course.getDepartment() != null ? course.getDepartment().getName() : null);

        if (course.getTeacher() != null) {
            CourseResponse.TeacherResponse teacherResponse = new CourseResponse.TeacherResponse();
            teacherResponse.setId(course.getTeacher().getId());
            teacherResponse.setUsername(course.getTeacher().getUsername());
            teacherResponse.setEmail(course.getTeacher().getEmail());
            teacherResponse.setModeratorType(course.getTeacher().getModeratorType());
            teacherResponse.setDepartment(course.getTeacher().getDepartment() != null ? course.getTeacher().getDepartment().getName() : null);
            teacherResponse.setSpecialization(course.getTeacher().getSpecialization());
            response.setTeacher(teacherResponse);
        }
        if (course.getCreatedBy() != null) {
            response.setCreatedById(course.getCreatedBy().getId());
            response.setCreatedByUsername(course.getCreatedBy().getUsername());
        }
        if (course.getUpdatedBy() != null) {
            response.setUpdatedById(course.getUpdatedBy().getId());
            response.setUpdatedByUsername(course.getUpdatedBy().getUsername());
        }
        response.setCreatedAt(course.getCreatedAt());
        response.setUpdatedAt(course.getUpdatedAt());
        return response;
    }

    /**
     * One-time migration: Set createdBy and updatedBy to a default admin user for all courses where these fields are null.
     * Call this method manually to fix existing data.
     */
    @Transactional
    public void setCreatedByAndUpdatedByForAllCourses(Long adminUserId) {
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Admin user not found with ID: " + adminUserId));
        List<Course> courses = courseRepository.findAll();
        int updated = 0;
        for (Course course : courses) {
            boolean changed = false;
            if (course.getCreatedBy() == null) {
                course.setCreatedBy(admin);
                changed = true;
            }
            if (course.getUpdatedBy() == null) {
                course.setUpdatedBy(admin);
                changed = true;
            }
            if (changed) {
                courseRepository.save(course);
                updated++;
            }
        }
        logger.info("Course migration complete. Records updated: {}", updated);
    }

    /**
     * QueryDSL-powered search for courses with filtering, sorting, and pagination.
     */
    public Page<CourseResponse> searchCourses(
            String courseCode,
            String courseName,
            String department,
            Long teacherId,
            Pageable pageable
    ) {
        QCourse qCourse = QCourse.course;
        BooleanBuilder builder = new BooleanBuilder();
        if (courseCode != null && !courseCode.isBlank()) {
            builder.and(qCourse.courseCode.containsIgnoreCase(courseCode));
        }
        if (courseName != null && !courseName.isBlank()) {
            builder.and(qCourse.courseName.containsIgnoreCase(courseName));
        }
        if (department != null && !department.isBlank()) {
            builder.and(qCourse.department.name.containsIgnoreCase(department));
        }
        if (teacherId != null) {
            builder.and(qCourse.teacher.id.eq(teacherId));
        }
        Page<Course> page = courseRepository.findAll(builder, pageable);
        return page.map(this::convertToCourseResponse);
    }
}
package com.example.try2.service;

import com.example.try2.entity.Grade;
import com.example.try2.entity.User;
import com.example.try2.entity.Course;
import com.example.try2.entity.Role;
import com.example.try2.entity.ERole;
import com.example.try2.payload.request.CreateGradeRequest;
import com.example.try2.payload.response.GradeResponse;
import com.example.try2.repository.GradeRepository;
import com.example.try2.repository.UserRepository;
import com.example.try2.repository.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.context.SecurityContextHolder;
import com.example.try2.security.services.UserDetailsImpl;
import com.example.try2.service.ActivityLogService;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CacheConfig;
import jakarta.persistence.OptimisticLockException;
import org.springframework.web.multipart.MultipartFile;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.ArrayList;
import java.util.Arrays;
import com.example.try2.exception.AppException;
import org.springframework.http.HttpStatus;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

@Service
@CacheConfig(cacheNames = {"grades"})
public class GradeService {
    private static final Logger logger = LoggerFactory.getLogger(GradeService.class);

    @Autowired
    private GradeRepository gradeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private ActivityLogService activityLogService;

    private User getCurrentUser() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findById(userDetails.getId()).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @CacheEvict(allEntries = true)
    @Transactional
    public GradeResponse saveGrade(CreateGradeRequest request) {
        try {
            logger.info("Starting to save grade...");
            logger.info("Student ID: {}", request.getStudentId());
            logger.info("Course ID: {}, Course Code: {}", request.getCourseId(), request.getCourseCode());
            
            // Validate student
            if (request.getStudentId() == null) {
                logger.error("Student ID is required");
                throw new RuntimeException("Student ID is required");
            }
            User student = userRepository.findById(request.getStudentId())
                    .orElseThrow(() -> {
                        logger.error("Student not found with ID: {}", request.getStudentId());
                        return new RuntimeException("Student not found with ID: " + request.getStudentId());
                    });
            
            // Verify that the user is actually a student
            boolean isStudent = student.getRoles().stream()
                    .anyMatch(role -> role.getName() == ERole.ROLE_USER);
            if (!isStudent) {
                logger.error("User with ID {} is not a student", request.getStudentId());
                throw new RuntimeException("User with ID " + request.getStudentId() + " is not a student");
            }
            
            logger.info("Found student with ID: {}", student.getId());

            // Validate course - try courseId first, then courseCode
            Course course = null;
            if (request.getCourseId() != null) {
                course = courseRepository.findById(request.getCourseId())
                        .orElseThrow(() -> {
                            logger.error("Course not found with ID: {}", request.getCourseId());
                            return new RuntimeException("Course not found with ID: " + request.getCourseId());
                        });
                logger.info("Found course by ID: {}", course.getCourseName());
            } else if (request.getCourseCode() != null) {
                course = courseRepository.findByCourseCode(request.getCourseCode())
                        .orElseThrow(() -> {
                            logger.error("Course not found with code: {}", request.getCourseCode());
                            return new RuntimeException("Course not found with code: " + request.getCourseCode());
                        });
                logger.info("Found course by code: {}", course.getCourseName());
            } else {
                logger.error("Either Course ID or Course Code is required");
                throw new RuntimeException("Either Course ID or Course Code is required");
            }

            // Create grade entity
            Grade grade = new Grade();
            grade.setStudent(student);
            grade.setCourse(course);
            grade.setScore(request.getScore());
            grade.setGrade(request.getGrade());
            grade.setSemester(request.getSemester());
            grade.setAcademicYear(request.getAcademicYear());
            grade.setStatus(request.getStatus());
            grade.setComments(request.getComments());
            grade.setCreatedBy(getCurrentUser());
            grade.setUpdatedBy(getCurrentUser());

            // Validate score
            if (grade.getScore() == null || grade.getScore() < 0 || grade.getScore() > 100) {
                logger.error("Invalid score: {}", grade.getScore());
                throw new RuntimeException("Score must be between 0 and 100");
            }

            // Validate grade
            if (grade.getGrade() == null || grade.getGrade().trim().isEmpty()) {
                logger.error("Grade is required");
                throw new RuntimeException("Grade is required");
            }

            // Validate semester
            if (grade.getSemester() == null) {
                logger.error("Semester is required");
                throw new RuntimeException("Semester is required");
            }

            // Validate academic year
            if (grade.getAcademicYear() == null || grade.getAcademicYear().trim().isEmpty()) {
                logger.error("Academic year is required");
                throw new RuntimeException("Academic year is required");
            }

            Grade savedGrade = gradeRepository.save(grade);
            logger.info("Successfully saved grade with ID: {}", savedGrade.getId());
            // Log activity
            User currentUser = getCurrentUser();
            activityLogService.logAction(
                currentUser.getId(),
                currentUser.getUsername(),
                "GRADE_CREATE",
                "Created grade for student " + student.getUsername() + " in course " + course.getCourseCode()
            );
            return convertToGradeResponse(savedGrade);
        } catch (Exception e) {
            logger.error("Error saving grade: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Cacheable
    public List<GradeResponse> getAllGrades() {
        logger.info("Cache miss: Retrieving all grades from DB and populating cache");
        List<GradeResponse> grades = gradeRepository.findAll().stream()
                .map(this::convertToGradeResponse)
                .collect(Collectors.toList());
        logger.info("Found {} grades", grades.size());
        return grades;
    }

    // Add a method to log cache hit for demo
    // This method will not be called, but the log will be shown if cache is hit
    public List<GradeResponse> getAllGradesCacheHit() {
        logger.info("Cache hit: Returning grades from cache");
        return null; // This is just for log demo, not used in logic
    }

    public GradeResponse getGradeById(Long id) {
        logger.info("Attempting to find grade with ID: {}", id);
        return gradeRepository.findById(id)
                .map(grade -> {
                    logger.info("Found grade with ID: {}", id);
                    return convertToGradeResponse(grade);
                })
                .orElseThrow(() -> {
                    logger.error("Grade not found with ID: {}", id);
                    return new AppException("Grade not found with ID: " + id, HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND");
                });
    }

    public List<GradeResponse> getGradesByStudentId(Long studentId) {
        return gradeRepository.findByStudent_Id(studentId).stream()
                .map(this::convertToGradeResponse)
                .collect(Collectors.toList());
    }

    public List<GradeResponse> getGradesByCourseId(Long courseId) {
        return gradeRepository.findByCourse_Id(courseId).stream()
                .map(this::convertToGradeResponse)
                .collect(Collectors.toList());
    }
    
    public List<GradeResponse> getGradesByMultipleCourseIds(List<Long> courseIds) {
        logger.info("Retrieving grades for multiple courses: {}", courseIds);
        if (courseIds == null || courseIds.isEmpty()) {
            logger.warn("No course IDs provided, returning empty list");
            return new ArrayList<>();
        }
        
        List<Grade> grades = new ArrayList<>();
        for (Long courseId : courseIds) {
            List<Grade> courseGrades = gradeRepository.findByCourse_Id(courseId);
            grades.addAll(courseGrades);
        }
        
        List<GradeResponse> gradeResponses = grades.stream()
                .map(this::convertToGradeResponse)
                .collect(Collectors.toList());
        
        logger.info("Found {} grades for the specified courses", gradeResponses.size());
        return gradeResponses;
    }

    public List<GradeResponse> getGradesByStudentAndCourse(Long studentId, Long courseId) {
        return gradeRepository.findByStudent_IdAndCourse_Id(studentId, courseId).stream()
                .map(this::convertToGradeResponse)
                .collect(Collectors.toList());
    }

    @CacheEvict(allEntries = true)
    @Transactional
    public GradeResponse updateGrade(Long id, Grade gradeDetails) {
        try {
            Grade grade = gradeRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Grade not found with ID: " + id));

            // Manual optimistic locking check
            if (gradeDetails.getVersion() == null || !gradeDetails.getVersion().equals(grade.getVersion())) {
                throw new OptimisticLockException("This grade was modified by someone else. Please refresh and try again.");
            }

            // Validate student
            if (gradeDetails.getStudent() != null && gradeDetails.getStudent().getId() != null) {
                User student = userRepository.findById(gradeDetails.getStudent().getId())
                        .orElseThrow(() -> new RuntimeException("Student not found with ID: " + gradeDetails.getStudent().getId()));
                boolean isStudent = student.getRoles().stream()
                        .anyMatch(role -> role.getName() == ERole.ROLE_USER);
                if (!isStudent) {
                    throw new RuntimeException("User with ID " + gradeDetails.getStudent().getId() + " is not a student");
                }
                grade.setStudent(student);
            }
            if (gradeDetails.getCourse() != null && gradeDetails.getCourse().getCourseCode() != null) {
                Course course = courseRepository.findByCourseCode(gradeDetails.getCourse().getCourseCode())
                        .orElseThrow(() -> new RuntimeException("Course not found with code: " + gradeDetails.getCourse().getCourseCode()));
                grade.setCourse(course);
            }
            if (gradeDetails.getScore() != null) {
                if (gradeDetails.getScore() < 0 || gradeDetails.getScore() > 100) {
                    throw new RuntimeException("Score must be between 0 and 100");
                }
                grade.setScore(gradeDetails.getScore());
            }
            if (gradeDetails.getGrade() != null && !gradeDetails.getGrade().trim().isEmpty()) {
                grade.setGrade(gradeDetails.getGrade());
            }
            if (gradeDetails.getSemester() != null) {
                grade.setSemester(gradeDetails.getSemester());
            }
            if (gradeDetails.getAcademicYear() != null && !gradeDetails.getAcademicYear().trim().isEmpty()) {
                grade.setAcademicYear(gradeDetails.getAcademicYear());
            }
            if (gradeDetails.getComments() != null) {
                grade.setComments(gradeDetails.getComments());
            }
            if (gradeDetails.getStatus() != null) {
                grade.setStatus(gradeDetails.getStatus());
            }
            grade.setUpdatedBy(getCurrentUser());
            Grade updatedGrade = gradeRepository.save(grade);
            // Log activity
            User currentUser = getCurrentUser();
            activityLogService.logAction(
                currentUser.getId(),
                currentUser.getUsername(),
                "GRADE_UPDATE",
                "Updated grade for student " + grade.getStudent().getUsername() + " in course " + grade.getCourse().getCourseCode()
            );
            return convertToGradeResponse(updatedGrade);
        } catch (OptimisticLockException e) {
            throw new RuntimeException("This grade was modified by someone else. Please refresh and try again.", e);
        }
    }

    @CacheEvict(allEntries = true)
    public void deleteGrade(Long id) {
        Grade grade = gradeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Grade not found with ID: " + id));
        gradeRepository.delete(grade);
        // Log activity
        User currentUser = getCurrentUser();
        activityLogService.logAction(
            currentUser.getId(),
            currentUser.getUsername(),
            "GRADE_DELETE",
            "Deleted grade for student " + grade.getStudent().getUsername() + " in course " + grade.getCourse().getCourseCode()
        );
    }

    @Transactional
    public void approveAllGrades() {
        logger.info("Updating all grades to APPROVED status");
        List<Grade> grades = gradeRepository.findAll();
        User currentUser = getCurrentUser();
        for (Grade grade : grades) {
            grade.setStatus("APPROVED");
            gradeRepository.save(grade);
            // Log activity for each grade approved
            activityLogService.logAction(
                currentUser.getId(),
                currentUser.getUsername(),
                "GRADE_APPROVE",
                "Approved grade for student " + grade.getStudent().getUsername() + " in course " + grade.getCourse().getCourseCode()
            );
        }
        logger.info("Successfully updated {} grades to APPROVED status", grades.size());
    }

    /**
     * One-time migration: Set createdBy and updatedBy to a default admin user for all grades where these fields are null.
     * Call this method manually to fix existing data.
     */
    @Transactional
    public void setCreatedByAndUpdatedByForAllGrades(Long adminUserId) {
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Admin user not found with ID: " + adminUserId));
        List<Grade> grades = gradeRepository.findAll();
        int updated = 0;
        for (Grade grade : grades) {
            boolean changed = false;
            if (grade.getCreatedBy() == null) {
                grade.setCreatedBy(admin);
                changed = true;
            }
            if (grade.getUpdatedBy() == null) {
                grade.setUpdatedBy(admin);
                changed = true;
            }
            if (changed) {
                gradeRepository.save(grade);
                updated++;
            }
        }
        logger.info("Grade migration complete. Records updated: {}", updated);
    }

    /**
     * Transpose grades: returns a map of student usernames to a map of course codes to grades.
     * This is useful for reporting or exporting grade tables.
     */
    public java.util.Map<String, java.util.Map<String, GradeResponse>> transposeGradesByStudentAndCourse() {
        List<Grade> grades = gradeRepository.findAll();
        java.util.Map<String, java.util.Map<String, GradeResponse>> result = new java.util.HashMap<>();
        for (Grade grade : grades) {
            String student = grade.getStudent().getUsername();
            String course = grade.getCourse().getCourseCode();
            result.computeIfAbsent(student, k -> new java.util.HashMap<>())
                  .put(course, convertToGradeResponse(grade));
        }
        return result;
    }

    /**
     * Import grades from a CSV file.
     * Expected CSV format:
     * studentId,courseId,score,grade,semester,academicYear,status,comments
     */
    @Transactional
    public List<GradeResponse> importGradesFromCsv(MultipartFile file) throws IOException {
        logger.info("Starting CSV import process");
        List<GradeResponse> importedGrades = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        int lineNumber = 1; // Header line

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            // Skip header line
            String headerLine = reader.readLine();
            if (headerLine == null) {
                throw new RuntimeException("CSV file is empty");
            }

            // Validate header
            String[] expectedHeaders = {"studentId", "courseId", "score", "grade", "semester", "academicYear", "status", "comments"};
            String[] headers = headerLine.split(",");
            if (!Arrays.equals(headers, expectedHeaders)) {
                throw new RuntimeException("Invalid CSV format. Expected headers: " + String.join(",", expectedHeaders));
            }

            String line;
            while ((line = reader.readLine()) != null) {
                lineNumber++;
                try {
                    String[] values = line.split(",");
                    if (values.length < 6) { // Minimum required fields
                        errors.add("Line " + lineNumber + ": Insufficient columns");
                        continue;
                    }

                    CreateGradeRequest request = new CreateGradeRequest();
                    
                    // Parse required fields
                    try {
                        request.setStudentId(Long.parseLong(values[0].trim()));
                        request.setCourseId(Long.parseLong(values[1].trim()));
                        request.setScore(Integer.parseInt(values[2].trim()));
                        request.setSemester(Integer.parseInt(values[4].trim()));
                    } catch (NumberFormatException e) {
                        errors.add("Line " + lineNumber + ": Invalid number format");
                        continue;
                    }

                    request.setGrade(values[3].trim());
                    request.setAcademicYear(values[5].trim());
                    
                    // Optional fields
                    if (values.length > 6) {
                        request.setStatus(values[6].trim());
                    }
                    if (values.length > 7) {
                        request.setComments(values[7].trim());
                    }

                    // Validate student exists
                    if (!userRepository.existsById(request.getStudentId())) {
                        errors.add("Line " + lineNumber + ": Student not found with ID: " + request.getStudentId());
                        continue;
                    }

                    // Validate course exists
                    if (!courseRepository.existsById(request.getCourseId())) {
                        errors.add("Line " + lineNumber + ": Course not found with ID: " + request.getCourseId());
                        continue;
                    }

                    // Validate score
                    if (request.getScore() < 0 || request.getScore() > 100) {
                        errors.add("Line " + lineNumber + ": Score must be between 0 and 100");
                        continue;
                    }

                    // Save grade
                    GradeResponse savedGrade = saveGrade(request);
                    importedGrades.add(savedGrade);

                } catch (Exception e) {
                    errors.add("Line " + lineNumber + ": " + e.getMessage());
                }
            }
        }

        // If there were any errors, throw an exception with all error messages
        if (!errors.isEmpty()) {
            throw new RuntimeException("Import completed with errors:\n" + String.join("\n", errors));
        }

        logger.info("Successfully imported {} grades", importedGrades.size());
        return importedGrades;
    }

    private GradeResponse convertToGradeResponse(Grade grade) {
        GradeResponse response = new GradeResponse();
        response.setId(grade.getId());
        response.setStudentId(grade.getStudent().getId());
        response.setStudentName(grade.getStudent().getUsername());
        response.setCourseId(grade.getCourse().getId());
        response.setCourseCode(grade.getCourse().getCourseCode());
        response.setCourseName(grade.getCourse().getCourseName());
        response.setScore(grade.getScore());
        response.setGrade(grade.getGrade());
        response.setSemester(grade.getSemester());
        response.setAcademicYear(grade.getAcademicYear());
        response.setStatus(grade.getStatus() != null ? grade.getStatus() : "PENDING");
        response.setComments(grade.getComments());
        if (grade.getCreatedBy() != null) {
            response.setCreatedById(grade.getCreatedBy().getId());
            response.setCreatedByUsername(grade.getCreatedBy().getUsername());
        }
        if (grade.getUpdatedBy() != null) {
            response.setUpdatedById(grade.getUpdatedBy().getId());
            response.setUpdatedByUsername(grade.getUpdatedBy().getUsername());
        }
        response.setCreatedAt(grade.getCreatedAt());
        response.setUpdatedAt(grade.getUpdatedAt());
        response.setVersion(grade.getVersion());
        return response;
    }

    /**
     * Provides a downloadable CSV template for grade import.
     */
    public ResponseEntity<Resource> getGradeImportTemplate() {
        String csvContent = "studentId,courseId,score,grade,semester,academicYear,status,comments\n" +
                "1,2,95,A,1,2024-2025,APPROVED,Excellent performance\n";
        ByteArrayResource resource = new ByteArrayResource(csvContent.getBytes());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=grades_template.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .contentLength(csvContent.length())
                .body(resource);
    }
}
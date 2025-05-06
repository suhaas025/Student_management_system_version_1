package com.example.try2.repository;

import com.example.try2.entity.Enrollment;
import com.example.try2.entity.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    
    List<Enrollment> findByStudent_Id(Long studentId);
    
    List<Enrollment> findByCourse_Id(Long courseId);
    
    List<Enrollment> findByStudent_IdAndStatus(Long studentId, EnrollmentStatus status);
    
    List<Enrollment> findByCourse_IdAndStatus(Long courseId, EnrollmentStatus status);
    
    Optional<Enrollment> findByStudent_IdAndCourse_Id(Long studentId, Long courseId);
    
    List<Enrollment> findByStudent_IdAndSemesterAndAcademicYear(Long studentId, String semester, String academicYear);
    
    List<Enrollment> findByCourse_IdAndSemesterAndAcademicYear(Long courseId, String semester, String academicYear);
    
    boolean existsByStudent_IdAndCourse_Id(Long studentId, Long courseId);
} 
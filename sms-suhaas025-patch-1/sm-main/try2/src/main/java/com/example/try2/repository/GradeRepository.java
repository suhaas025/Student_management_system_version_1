package com.example.try2.repository;

import com.example.try2.entity.Grade;
import com.example.try2.entity.User;
import com.example.try2.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GradeRepository extends JpaRepository<Grade, Long> {
    List<Grade> findByStudent_Id(Long studentId);
    List<Grade> findByCourse_Id(Long courseId);
    List<Grade> findByStudent_IdAndCourse_Id(Long studentId, Long courseId);
}
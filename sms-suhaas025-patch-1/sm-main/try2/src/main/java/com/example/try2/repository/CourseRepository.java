package com.example.try2.repository;

import com.example.try2.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long>, QuerydslPredicateExecutor<Course> {
    Optional<Course> findByCourseCode(String courseCode);
    List<Course> findByTeacher_Id(Long teacherId);
}
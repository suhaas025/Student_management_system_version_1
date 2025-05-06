package com.example.try2.payload.request;

import lombok.Data;

@Data
public class UpdateCourseRequest {
    private String courseCode;
    private String courseName;
    private String description;
    private Integer credits;
    private String semester;
    private String academicYear;
    private Long departmentId;
    private String departmentName; // <-- Add this line
    private Long teacherId;
} 
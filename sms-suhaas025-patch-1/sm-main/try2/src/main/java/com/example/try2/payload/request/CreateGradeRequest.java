package com.example.try2.payload.request;

import lombok.Data;

@Data
public class CreateGradeRequest {
    private Long studentId;
    private Long courseId;
    private String courseCode;
    private Integer score;
    private String grade;
    private Integer semester;
    private String academicYear;
    private String status = "PENDING";
    private String comments;
} 
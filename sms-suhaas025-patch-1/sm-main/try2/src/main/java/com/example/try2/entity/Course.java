package com.example.try2.entity;

import com.example.try2.payload.response.TeacherResponse;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import org.springframework.beans.BeanUtils;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "courses")
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "course_code")
    private String courseCode;

    @Column(name = "course_name")
    private String courseName;

    @Column(name = "description")
    private String description;

    @Column(name = "credits")
    private Integer credits;

    @Column(name = "semester")
    private String semester;

    @Column(name = "academic_year")
    private String academicYear;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "teacher_id")
    private User teacher;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    @JsonProperty("teacher")
    public TeacherResponse getTeacherResponse() {
        if (teacher != null) {
            TeacherResponse response = new TeacherResponse();
            response.setId(teacher.getId());
            response.setUsername(teacher.getUsername());
            response.setEmail(teacher.getEmail());
            return response;
        }
        return null;
    }

    @JsonProperty("teacher")
    public void setTeacherFromRequest(TeacherResponse teacherResponse) {
        if (teacherResponse != null && teacherResponse.getId() != null) {
            User user = new User();
            user.setId(teacherResponse.getId());
            this.teacher = user;
        }
    }

    @Override
    public String toString() {
        return "Course{" +
                "id=" + id +
                ", courseCode='" + courseCode + '\'' +
                ", courseName='" + courseName + '\'' +
                ", description='" + description + '\'' +
                ", credits=" + credits +
                ", semester='" + semester + '\'' +
                ", academicYear='" + academicYear + '\'' +
                ", department=" + (department != null ? department.getId() : "null") +
                ", teacher=" + (teacher != null ? teacher.getId() : "null") +
                '}';
    }
}
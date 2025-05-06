package com.example.try2;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import com.example.try2.service.UserService;
import com.example.try2.service.AnnouncementService;
import com.example.try2.service.CourseService;
import com.example.try2.service.EnrollmentService;
import com.example.try2.service.GradeService;

@SpringBootApplication
@EnableScheduling
public class Try2Application {

	public static void main(String[] args) {
		SpringApplication.run(Try2Application.class, args);
	}

	@Bean
	public CommandLineRunner emailMigrationRunner(@Autowired UserService userService) {
		return args -> {
			for (String arg : args) {
				if (arg.equals("--encrypt-emails-migration=true")) {
					userService.encryptAllPlainEmailsNative();
				}
			}
		};
	}

	@Bean
	public CommandLineRunner createdByMigrationRunner(
		@Autowired AnnouncementService announcementService,
		@Autowired CourseService courseService,
		@Autowired EnrollmentService enrollmentService,
		@Autowired GradeService gradeService,
		@Autowired UserService userService
	) {
		return args -> {
			Long adminId = 1L; // Replace with your actual admin user ID if different
			announcementService.setCreatedByAndUpdatedByForAllAnnouncements(adminId);
			courseService.setCreatedByAndUpdatedByForAllCourses(adminId);
			enrollmentService.setCreatedByAndUpdatedByForAllEnrollments(adminId);
			gradeService.setCreatedByAndUpdatedByForAllGrades(adminId);
			userService.setCreatedByAndUpdatedByForAllUsers(adminId);
		};
	}

	@Bean
	public CommandLineRunner fixBlankEmailsRunner(@Autowired UserService userService) {
		return args -> {
			userService.fixBlankEmails();
		};
	}

}

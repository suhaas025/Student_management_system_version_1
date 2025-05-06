import api from './api.service';

class EnrollmentService {
    // Get all enrollments for the current student
    getMyEnrollments(status = null) {
        const url = status 
            ? `/enrollments/student?status=${status}`
            : '/enrollments/student';
        return api.get(url);
    }

    // Get enrollments for a specific student (admin/moderator only)
    getStudentEnrollments(studentId, status = null) {
        const url = status 
            ? `/enrollments/student/${studentId}?status=${status}`
            : `/enrollments/student/${studentId}`;
        return api.get(url);
    }

    // Get enrollments for a specific course (admin/moderator only)
    getCourseEnrollments(courseId) {
        return api.get(`/enrollments/course/${courseId}`);
    }

    // Get a specific enrollment by ID
    getEnrollment(id) {
        return api.get(`/enrollments/${id}`);
    }

    // Enroll in a course
    enrollInCourse(courseId, semester = null, academicYear = null) {
        const data = {
            courseId,
            semester,
            academicYear
        };
        return api.post('/enrollments', data);
    }

    // Update enrollment status (admin/moderator only)
    updateEnrollmentStatus(id, requestData) {
        return api.put(`/enrollments/${id}/status`, requestData);
    }

    // Delete enrollment
    deleteEnrollment(id) {
        return api.delete(`/enrollments/${id}`);
    }

    // Get enrollment statuses for UI display
    getEnrollmentStatuses() {
        return [
            { value: 'PENDING', label: 'Pending', color: 'warning' },
            { value: 'APPROVED', label: 'Approved', color: 'success' },
            { value: 'REJECTED', label: 'Rejected', color: 'error' },
            { value: 'WITHDRAWN', label: 'Withdrawn', color: 'default' },
            { value: 'COMPLETED', label: 'Completed', color: 'info' }
        ];
    }

    // Helper to get color for a status
    getStatusColor(status) {
        const statusObj = this.getEnrollmentStatuses().find(s => s.value === status);
        return statusObj ? statusObj.color : 'default';
    }

    // Helper to get label for a status
    getStatusLabel(status) {
        const statusObj = this.getEnrollmentStatuses().find(s => s.value === status);
        return statusObj ? statusObj.label : status;
    }
}

export default new EnrollmentService(); 
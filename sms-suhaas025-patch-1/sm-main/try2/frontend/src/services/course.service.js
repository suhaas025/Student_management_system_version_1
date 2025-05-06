import api from './api.service';
import axios from 'axios';
import authHeader from './auth-header';
import authService from './auth.service';

// Helper function to get auth headers for requests
const getAuthHeader = () => {
    const token = authService.getToken();
    if (!token) {
        console.error('No authentication token available for course service request');
        return {};
    }
    return { Authorization: `Bearer ${token}` };
};

class CourseService {
    getAllCourses() {
        console.log('Fetching all courses');
        return api.get('/courses', { headers: getAuthHeader() })
            .then(response => {
                console.log(`Retrieved ${response.data.length} courses`);
                return response;
            })
            .catch(error => {
                console.error('Error fetching courses:', error);
                // Return empty array to avoid breaking UI
                return { data: [] };
            });
    }

    getCourseById(id) {
        return api.get(`/courses/${id}`, { headers: getAuthHeader() });
    }

    createCourse(courseData) {
        // Ensure all headers are set correctly
        const headers = {
            ...getAuthHeader(),
            'Content-Type': 'application/json'
        };
        console.log('Creating course with headers:', headers);
        console.log('Creating course with data:', JSON.stringify(courseData, null, 2));
        return api.post('/courses', courseData, { headers });
    }

    updateCourse(id, courseData) {
        console.log(`Updating course ID ${id} with data:`, courseData);
        console.log(`Academic Year being sent to backend: ${courseData.academicYear}`);
        
        return api.put(`/courses/${id}`, courseData, { headers: getAuthHeader() })
            .then(response => {
                console.log(`Course update response:`, response.data);
                console.log(`Academic Year in response: ${response.data.academicYear}`);
                return response;
            })
            .catch(error => {
                console.error('Error updating course:', error.response?.data || error.message);
                throw error;
            });
    }

    deleteCourse(id) {
        return api.delete(`/courses/${id}`, { headers: getAuthHeader() });
    }

    getCoursesByTeacher(teacherId) {
        return api.get(`/courses/teacher/${teacherId}`, { headers: getAuthHeader() });
    }

    getModeratorCourses() {
        // This will fetch courses that the current moderator can manage
        // Initially, we can return all courses for the moderator role
        return api.get('/courses/moderator', { headers: getAuthHeader() });
    }

    getCourseGrades(courseId) {
        return api.get(`/courses/${courseId}/grades`, { headers: getAuthHeader() });
    }

    // Helper function to format course data for API
    formatCourseData(formData) {
        // Create a teacher object if teacherId is provided
        const courseData = { ...formData };
        
        if (formData.teacherId) {
            courseData.teacher = {
                id: formData.teacherId
            };
            // Remove the teacherId from the data as it's not part of the API model
            delete courseData.teacherId;
        }
        
        // Send department as an object with name only
        if (formData.department && typeof formData.department === 'object' && formData.department.name) {
            courseData.department = { name: formData.department.name };
        } else if (typeof formData.department === 'string' && formData.department) {
            courseData.department = { name: formData.department };
        } else {
            delete courseData.department;
            console.error('Department name is required but was not provided');
            throw new Error('Department name is required');
        }
        
        // Ensure academicYear is included and not empty
        if (!courseData.academicYear) {
            console.warn('Academic year is empty, setting to current academic year');
            // Recalculate the current academic year
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            
            if (currentMonth >= 6) { // July or later
                courseData.academicYear = `${currentYear}-${currentYear + 1}`;
            } else {
                courseData.academicYear = `${currentYear - 1}-${currentYear}`;
            }
        }
        
        console.log('Formatted course data for API:', courseData);
        console.log('Academic Year being sent:', courseData.academicYear);
        
        return courseData;
    }

    getCoursesPaginated(params = {}) {
        // params: { page, size, sort, courseCode, courseName, department, teacherId }
        return api.get('/courses', { params, headers: getAuthHeader() });
    }
}

export default new CourseService(); 
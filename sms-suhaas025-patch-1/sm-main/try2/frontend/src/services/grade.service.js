import api from './api.service';
import authService from './auth.service';
import axios from 'axios';
import authHeader from './auth-header';

// Replace hardcoded URL with a dynamic one that can be updated from the environment
// Checking for BASE_URL or API_URL in the API service and falling back to localhost:8080
const API_URL = api.defaults.baseURL || 'http://localhost:8080/api/grades/';

// Debug log to verify the API URL
console.log('Grade Service API URL:', API_URL);

const getAuthHeader = () => {
    const token = authService.getToken();
    if (!token) {
        console.error('No authentication token available for request');
        return {};
    }
    console.log('Using token for request:', token ? `${token.substring(0, 15)}...` : 'none');
    return { Authorization: `Bearer ${token}` };
};

// Helper function to create a request with auth headers
const createRequestWithAuth = (endpoint, method = 'get', data = null) => {
    const token = authService.getToken();
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
    
    if (!token) {
        console.warn(`No token available for ${method.toUpperCase()} request to ${endpoint}`);
    } else {
        console.log(`Using token for ${method.toUpperCase()} request to ${endpoint}`);
    }
    
    const config = {
        url: endpoint,
        method: method,
        headers: headers
    };
    
    if (data) {
        config.data = data;
    }
    
    return axios(config)
        .catch(error => {
            if (error.response && error.response.status === 401) {
                console.error('Authentication failed (401):', error.response.data);
                // If development mode, try to use direct API call as fallback
                if (process.env.NODE_ENV === 'development') {
                    console.log('DEV MODE: Attempting direct API call as fallback');
                    return createDirectApiRequest(endpoint, method, data);
                }
            }
            throw error;
        });
};

// Direct API call for development fallbacks
const createDirectApiRequest = (endpoint, method = 'get', data = null) => {
    const directUrl = `http://localhost:8080/api${endpoint}`;
    console.log(`DEV MODE: Making direct API call to ${directUrl}`);
    
    const token = authService.getToken();
    const config = {
        url: directUrl,
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        }
    };
    
    if (data) {
        config.data = data;
    }
    
    return axios(config);
};

class GradeService {
    // Client-side cache key and expiry (5 minutes)
    static GRADES_CACHE_KEY = 'grades_cache';
    static GRADES_CACHE_EXPIRY = 5 * 60 * 1000;

    getAllGrades() {
        // Try to get from cache first
        const cached = localStorage.getItem(GradeService.GRADES_CACHE_KEY);
        if (cached) {
            try {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < GradeService.GRADES_CACHE_EXPIRY) {
                    console.log('Client cache hit: Returning grades from cache');
                    return Promise.resolve({ data });
                } else {
                    localStorage.removeItem(GradeService.GRADES_CACHE_KEY);
                }
            } catch (e) {
                localStorage.removeItem(GradeService.GRADES_CACHE_KEY);
            }
        }
        // If not in cache, fetch from API
        console.log('Client cache miss: Fetching grades from API');
        return api.get('/grades', { headers: getAuthHeader() })
            .then(response => {
                localStorage.setItem(GradeService.GRADES_CACHE_KEY, JSON.stringify({ data: response.data, timestamp: Date.now() }));
                return response;
            })
            .catch(error => {
                console.error('Error in getAllGrades:', error);
                if (error.response) {
                    throw error;
                } else {
                    console.log('Trying fallback endpoint for grades...');
                    return this.getAllGradesFallback();
                }
            });
    }

    // Fallback method if /grades endpoint is not available
    getAllGradesFallback() {
        // Try to get grades from student API first
        return api.get('/users/students', { headers: getAuthHeader() })
            .then(response => {
                const students = response.data;
                if (!students || students.length === 0) {
                    console.log('No students found to fetch grades for');
                    return { data: [] };
                }
                
                // Get grades for the first student as a sample
                const firstStudent = students[0];
                return this.getGradesByStudentId(firstStudent.id)
                    .then(gradesResponse => {
                        console.log(`Found ${gradesResponse.data?.length || 0} grades for student`);
                        return gradesResponse;
                    })
                    .catch(error => {
                        console.error('Error getting grades by student:', error);
                        return { data: [] };
                    });
            })
            .catch(error => {
                console.error('Error in fallback grade retrieval:', error);
                // Return empty array as fallback
                return { data: [] };
            });
    }

    getGradeById(id) {
        return api.get(`/grades/${id}`, { headers: getAuthHeader() });
    }

    getGradesByStudentId(studentId) {
        // First try using the API service
        return api.get(`/grades/user/${studentId}`, { headers: getAuthHeader() })
            .catch(error => {
                console.error(`Error getting grades for student ${studentId}:`, error);
                if (process.env.NODE_ENV === 'development' && error.response?.status === 401) {
                    // In development mode, try a direct axios call as fallback
                    console.log('DEV MODE: Trying direct request for student grades');
                    return createRequestWithAuth(`/grades/user/${studentId}`);
                }
                throw error;
            });
    }

    getGradesByCourseId(courseId) {
        return api.get(`/grades/course/${courseId}`, { headers: getAuthHeader() });
    }

    getGradesByStudentAndCourse(studentId, courseId) {
        return api.get(`/grades/student/${studentId}/course/${courseId}`, { headers: getAuthHeader() });
    }

    // Moderator-specific methods
    getModeratorGrades() {
        return api.get('/grades/moderator', { headers: getAuthHeader() });
    }

    getModeratorCourseGrades(courseId) {
        return api.get(`/grades/moderator/course/${courseId}`, { headers: getAuthHeader() });
    }

    createGrade(gradeData) {
        console.log('grade.service: Creating grade with data:', gradeData);
        
        // Create a cleaned copy of the data to ensure consistent format
        const cleanedData = {
            studentId: gradeData.studentId,
            score: gradeData.score,
            grade: gradeData.grade,
            status: gradeData.status || 'PENDING',
            comments: gradeData.comments || '',
            semester: gradeData.semester || '',
            academicYear: gradeData.academicYear || ''
        };
        
        // Add either courseId or courseCode depending on what's available
        if (gradeData.courseCode) {
            cleanedData.courseCode = gradeData.courseCode;
        }
        
        if (gradeData.courseId) {
            cleanedData.courseId = gradeData.courseId;
        }
        
        console.log('grade.service: Sending cleaned grade data:', cleanedData);
        
        // Try first with the standard endpoint
        return api.post('/grades', cleanedData, { headers: getAuthHeader() })
            .catch(error => {
                console.error('Error in createGrade:', error);
                console.error('Grade data that failed:', cleanedData);
                
                if (error.response) {
                    console.error('Response data:', error.response.data);
                    console.error('Response status:', error.response.status);
                    console.error('Response headers:', error.response.headers);
                    
                    // If there's a 404 or specific error suggesting endpoint doesn't exist
                    if (error.response.status === 404 || 
                        (error.response.data && error.response.data.message === 'Endpoint not found')) {
                        console.log('Trying fallback grade creation endpoint...');
                        // Try a fallback endpoint
                        return api.post('/grade', cleanedData, { headers: getAuthHeader() });
                    }
                }
                
                throw error;
            });
    }

    updateGrade(id, gradeData) {
        console.log(`grade.service: Updating grade ${id} with data:`, gradeData);
        console.log(`grade.service: Using version: ${gradeData.version}`);
        
        // Create a cleaned copy of the data
        const cleanedData = {};
        
        // Only include defined fields
        if (gradeData.score !== undefined) cleanedData.score = gradeData.score;
        if (gradeData.grade !== undefined) cleanedData.grade = gradeData.grade;
        if (gradeData.status !== undefined) cleanedData.status = gradeData.status;
        if (gradeData.comments !== undefined) cleanedData.comments = gradeData.comments;
        if (gradeData.semester !== undefined) cleanedData.semester = gradeData.semester;
        if (gradeData.academicYear !== undefined) cleanedData.academicYear = gradeData.academicYear;
        if (gradeData.courseCode !== undefined) cleanedData.courseCode = gradeData.courseCode;
        if (gradeData.courseId !== undefined) cleanedData.courseId = gradeData.courseId;
        if (gradeData.version !== undefined) {
            cleanedData.version = gradeData.version;
            console.log(`grade.service: Including version ${gradeData.version} in update request`);
        } else {
            console.warn('grade.service: No version provided for update request');
        }
        
        console.log('grade.service: Sending cleaned update data:', cleanedData);
        
        return api.put(`/grades/${id}`, cleanedData, { headers: getAuthHeader() })
            .then(response => {
                console.log(`grade.service: Successfully updated grade ${id}`);
                return response;
            })
            .catch(error => {
                console.error(`Error updating grade ${id}:`, error);
                console.error('Grade data that failed:', cleanedData);
                
                if (error.response) {
                    console.error('Response data:', error.response.data);
                    console.error('Response status:', error.response.status);
                    
                    if (error.response.status === 409) {
                        console.error('Version conflict detected. Current client version:', gradeData.version);
                    }
                    
                    // If there's a 404 or specific error suggesting endpoint doesn't exist
                    if (error.response.status === 404) {
                        console.log('Trying fallback grade update endpoint...');
                        // Try a fallback endpoint
                        return api.put(`/grade/${id}`, cleanedData, { headers: getAuthHeader() });
                    }
                }
                
                throw error;
            });
    }

    deleteGrade(id) {
        return api.delete(`/grades/${id}`, { headers: getAuthHeader() });
    }

    approveAllGrades() {
        return api.put('/grades/approve-all', {}, { headers: getAuthHeader() });
    }

    // Standardized GPA calculation used by both student and moderator dashboards
    calculateStandardGPA(grades) {
        if (!grades || grades.length === 0) return 'N/A';
        
        // Only consider grades with valid scores
        const validGrades = grades.filter(grade => 
            grade.score !== null && 
            grade.score !== undefined
        );
        
        if (validGrades.length === 0) return 'N/A';
        
        // Convert scores to GPA points using a consistent scale
        const gpaTotals = validGrades.map(grade => {
            const score = grade.score;
            
            // Standardized score to GPA conversion
            if (score >= 97) return 4.0;  // A+
            if (score >= 93) return 4.0;  // A
            if (score >= 90) return 3.7;  // A-
            if (score >= 87) return 3.3;  // B+
            if (score >= 83) return 3.0;  // B
            if (score >= 80) return 2.7;  // B-
            if (score >= 77) return 2.3;  // C+
            if (score >= 73) return 2.0;  // C
            if (score >= 70) return 1.7;  // C-
            if (score >= 67) return 1.3;  // D+
            if (score >= 63) return 1.0;  // D
            if (score >= 60) return 0.7;  // D-
            return 0.0;  // F
        });
        
        const gpaSum = gpaTotals.reduce((sum, gpa) => sum + gpa, 0);
        // Return GPA with two decimal places
        return (gpaSum / gpaTotals.length).toFixed(2);
    }

    getGradesByStatus(status) {
        console.log(`Fetching grades with status: ${status}`);
        return api.get(`/grades/status/${status}`, { headers: getAuthHeader() })
            .then(response => {
                console.log(`Retrieved ${response.data.length} ${status} grades`);
                return response;
            })
            .catch(error => {
                console.error(`Error fetching ${status} grades:`, error);
                // Return empty array to avoid breaking UI
                return { data: [] };
            });
    }

    createGradesBatch(batchData) {
        return api.post('/grades/batch', batchData, { headers: getAuthHeader() });
    }

    importGradesCsv(file) {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/grades/import-csv', formData, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'multipart/form-data'
            }
        });
    }

    downloadImportTemplate() {
        return api.get('/grades/import-template', {
            headers: getAuthHeader(),
            responseType: 'blob',
        });
    }
}

export default new GradeService(); 
import api from './api.service';
import axios from 'axios';
import authHeader from './auth-header';
import authService from './auth.service';

class UserService {
    getAllUsers() {
        console.log('Fetching all users from API...');
        return api.get('/users')
            .then(response => {
                console.log('API response for getAllUsers:', response);
                console.log('Number of users returned:', response.data?.length || 0);
                
                // Process the users to ensure department field is consistent
                if (response.data && response.data.length > 0) {
                    console.log('First user keys:', Object.keys(response.data[0]));
                    
                    // Process each user to ensure department has a value
                    response.data = response.data.map(user => {
                        // Ensure department is a string, not null or undefined
                        if (user.department === null || user.department === undefined || user.department === '') {
                            console.log(`Setting department for user ${user.username}`);
                            user.department = 'No Department Set';
                        }
                        return user;
                    });
                    
                    let hasDepartmentCount = 0;
                    let nullDepartmentCount = 0;
                    let emptyDepartmentCount = 0;
                    
                    response.data.forEach(user => {
                        if ('department' in user) hasDepartmentCount++;
                        if (user.department === null) nullDepartmentCount++;
                        if (user.department === '') emptyDepartmentCount++;
                    });
                    
                    console.log(`Users with department field: ${hasDepartmentCount}/${response.data.length}`);
                    console.log(`Users with null department: ${nullDepartmentCount}`);
                    console.log(`Users with empty department: ${emptyDepartmentCount}`);
                }
                
                return response;
            })
            .catch(error => {
                console.error('Error fetching all users:', error);
                throw error;
            });
    }

    getAll() {
        return api.get('/users');
    }

    getAllModerators() {
        return api.get('/users/moderators');
    }

    getAllStudents() {
        return api.get('/users').then(response => {
            // Use response.data.content for paginated responses
            const users = Array.isArray(response.data) ? response.data : response.data.content;
            return users.filter(user => {
                // Filter for users with ROLE_USER (or adjust as needed)
                return user.roles && user.roles.some(role => role.name === 'ROLE_USER');
            });
        });
    }

    getModeratorStudents() {
        // Use the direct endpoint for students that moderators have access to
        console.log('Getting students accessible by moderator');
        return api.get('/users/students')
            .then(response => {
                console.log('Retrieved students for moderator:', response.data.length);
                return response;
            })
            .catch(error => {
                console.error('Error in getModeratorStudents:', error);
                throw error;
            });
    }

    getStudentGrades(studentId) {
        console.log(`Getting grades for student: ${studentId}`);
        return api.get(`/grades/user/${studentId}`)
            .then(response => {
                console.log("Student grades response data:", JSON.stringify(response.data));
                return response;
            })
            .catch(error => {
                console.error("Error fetching student grades:", error);
                throw error;
            });
    }

    getStudentCourses(studentId) {
        console.log(`Getting courses for student: ${studentId}`);
        return api.get(`/enrollments/student/${studentId}`)
            .then(response => {
                console.log("Student enrollments response:", response.data);
                // Process enrollments to separate approved and pending courses
                const enrolledCourses = [];
                const pendingCourses = [];
                
                response.data.forEach(enrollment => {
                    const courseObj = {
                        id: enrollment.courseId,
                        name: enrollment.courseName || enrollment.course?.courseName,
                        code: enrollment.courseCode || enrollment.course?.courseCode,
                        credits: enrollment.course?.credits || 3,
                        description: enrollment.course?.description || 'No description available',
                        status: enrollment.status || 'PENDING'
                    };
                    
                    if (enrollment.status === 'APPROVED') {
                        enrolledCourses.push(courseObj);
                    } else {
                        pendingCourses.push(courseObj);
                    }
                });
                
                return { 
                    data: {
                        enrolled: enrolledCourses,
                        pending: pendingCourses
                    }
                };
            })
            .catch(error => {
                console.error("Error fetching student courses:", error);
                // If there's no enrollment endpoint or another error occurs,
                // use the student's grades to extract course information as a fallback
                return this.getStudentGrades(studentId)
                    .then(response => {
                        const grades = response.data || [];
                        // Extract unique courses from grades (these are definitely enrolled)
                        const courseMap = {};
                        grades.forEach(grade => {
                            if (!courseMap[grade.courseId]) {
                                courseMap[grade.courseId] = {
                                    id: grade.courseId,
                                    name: grade.courseName,
                                    code: grade.courseCode,
                                    credits: 3, // Default credits
                                    description: 'Course information from grade records',
                                    status: 'APPROVED'
                                };
                            }
                        });
                        return { 
                            data: {
                                enrolled: Object.values(courseMap),
                                pending: []
                            }
                        };
                    })
                    .catch(() => {
                        // If all else fails, return empty arrays
                        return { 
                            data: {
                                enrolled: [],
                                pending: []
                            }
                        };
                    });
            });
    }

    get(id) {
        return api.get(`/users/${id}`);
    }

    create(userData) {
        console.log('Creating user with data (before processing):', userData);
        
        // Validate required fields
        if (!userData.username || !userData.email || !userData.password) {
            console.error('Missing required fields for user creation');
            return Promise.reject(new Error('Username, email and password are required'));
        }
        
        // Extract and normalize roles
        let roles = [];
        if (userData.roles && Array.isArray(userData.roles)) {
            // Process all roles in the array
            roles = userData.roles.map(role => {
                const normalized = typeof role === 'string' 
                    ? role.replace('ROLE_', '').toLowerCase() 
                    : role;
                    
                // Map 'moderator' to 'mod' for backend compatibility
                return normalized === 'moderator' ? 'mod' : normalized;
            });
            console.log('Multiple roles processed for creation:', roles);
        } else if (userData.role) {
            // Legacy support for single role
            let roleValue = typeof userData.role === 'string' 
                ? userData.role.replace('ROLE_', '').toLowerCase()
                : userData.role;
                
            // Map 'moderator' to 'mod' for backend compatibility
            roleValue = roleValue === 'moderator' ? 'mod' : roleValue;
            roles = [roleValue];
            console.log('Single role extracted for creation:', roles);
        } else {
            roles = ['user'];
            console.log('No role provided, defaulting to "user"');
        }
        
        // Create a clean request object with proper role format
        const requestData = {
            username: userData.username,
            email: userData.email,
            password: userData.password,
            role: roles, // Backend expects "role" as an array
            
            // Include other fields as needed
            department: userData.department || 'General Department',
            departmentId: userData.departmentId || null,
            degree: userData.degree || '',
            ...(userData.yearOfStudy && { yearOfStudy: parseInt(userData.yearOfStudy, 10) || null }),
        };
        
        // Make sure department is set to a non-empty value
        if (!requestData.department || requestData.department.trim() === '') {
            requestData.department = 'General Department';
        }
        
        // Store the original department data to restore later if needed
        const originalDepartment = {
            id: userData.departmentId,
            name: userData.department
        };
        
        // Check if this user has a moderator role
        if (roles.includes('mod') && userData.moderatorType) {
            console.log('Creating user with moderator role and type:', userData.moderatorType);
            
            // Add moderator-specific fields
            requestData.moderatorType = userData.moderatorType;
            
            // Include the appropriate fields based on moderator type
            switch (userData.moderatorType) {
                case 'TEACHER':
                    if (userData.specialization !== undefined) 
                        requestData.specialization = userData.specialization;
                    break;
                case 'HOSTEL_WARDEN':
                    if (userData.hostelName !== undefined) 
                        requestData.hostelName = userData.hostelName;
                    break;
                case 'LIBRARIAN':
                    if (userData.librarySection !== undefined) 
                        requestData.librarySection = userData.librarySection;
                    break;
                case 'LAB_INCHARGE':
                    if (userData.labName !== undefined) 
                        requestData.labName = userData.labName;
                    break;
                case 'SPORTS_COORDINATOR':
                    if (userData.sportsCategory !== undefined) 
                        requestData.sportsCategory = userData.sportsCategory;
                    break;
                case 'CULTURAL_COORDINATOR':
                    if (userData.culturalCategory !== undefined) 
                        requestData.culturalCategory = userData.culturalCategory;
                    break;
                case 'ACADEMIC_COORDINATOR':
                    if (userData.academicProgram !== undefined) 
                        requestData.academicProgram = userData.academicProgram;
                    break;
            }
        }
        
        console.log('Final create data being sent to server:', JSON.stringify(requestData, null, 2));
        
        return api.post('/auth/create-user', requestData)
            .then(response => {
                console.log('User creation response:', response.data);
                
                // Create a user object with the data sent, as the backend may not return complete data
                const createdUser = {
                    ...response.data,
                    username: requestData.username,
                    email: requestData.email,
                    roles: requestData.role.map(role => ({ name: `ROLE_${role.toUpperCase()}` })),
                    department: originalDepartment.name || requestData.department,
                    departmentId: originalDepartment.id || requestData.departmentId,
                    degree: requestData.degree
                };
                
                // Set the response data to our enhanced object
                response.data = createdUser;
                console.log('Enhanced user data with department:', createdUser);
                
                return response;
            })
            .catch(error => {
                console.error('Error creating user:', error.response?.data || error.message);
                throw error;
            });
    }

    createModerator(moderatorData) {
        console.log('Creating moderator with data:', moderatorData);
        return api.post('/auth/create-moderator', moderatorData);
    }

    update(id, userData) {
        console.log('Updating user with data:', userData);
        console.log('Role from userData:', userData.role);
        console.log('Roles from userData:', userData.roles);
        
        // Handle multiple roles properly
        let roles = [];
        if (userData.roles && Array.isArray(userData.roles)) {
            // Process all roles in the array
            roles = userData.roles.map(role => {
                return typeof role === 'string' 
                    ? role.replace('ROLE_', '').toLowerCase() 
                    : role;
            });
            
            // Map 'moderator' to 'mod' for backend compatibility
            roles = roles.map(role => role === 'moderator' ? 'mod' : role);
            
            console.log('Multiple roles extracted and processed:', roles);
        } else if (userData.role) {
            // Legacy support for single role
            let role = typeof userData.role === 'string' 
                ? userData.role.replace('ROLE_', '').toLowerCase()
                : userData.role;
                
            // Map 'moderator' to 'mod' for backend compatibility
            role = role === 'moderator' ? 'mod' : role;
            roles = [role];
            console.log('Single role extracted from role property:', roles);
        } else {
            // Default to user if no role is provided
            roles = ['user'];
            console.warn('No role provided in update data, defaulting to "user"');
        }

        // Store the original department data to restore later if needed
        const originalDepartment = {
            id: userData.departmentId,
            name: userData.department
        };

        // Create a clean update object with only the necessary fields
        const updateData = {
            username: userData.username,
            email: userData.email,
            // Send roles as an array
            role: roles, // This is what the backend expects
            // Always include department regardless of role - with a string value
            department: userData.department === undefined ? '' : String(userData.department),
            departmentId: userData.departmentId || null
        };

        console.log('Update data with role array:', updateData);

        // Make sure it's a non-empty string for display
        if (!updateData.department || updateData.department.trim() === '') {
            updateData.department = "No Department Set";
        }

        // Add role-specific fields based on included roles
        const hasStudentRole = roles.includes('user');
        const hasModeratorRole = roles.includes('mod');
        
        // Add student-specific fields if the user has a student role
        if (hasStudentRole) {
            if (userData.degree !== undefined) updateData.degree = userData.degree;
            if (userData.yearOfStudy !== undefined && userData.yearOfStudy !== '') {
                updateData.yearOfStudy = parseInt(userData.yearOfStudy);
            }
        }
        
        // Add moderator-specific fields if the user has a moderator role
        if (hasModeratorRole) {
            // For moderator role, moderatorType is required
            if (userData.moderatorType !== undefined) {
                updateData.moderatorType = userData.moderatorType;
                console.log('Setting moderatorType to:', userData.moderatorType);
                
                // Add fields based on moderator type
                switch (userData.moderatorType) {
                    case 'TEACHER':
                        if (userData.specialization !== undefined) 
                            updateData.specialization = userData.specialization;
                        break;
                    case 'HOSTEL_WARDEN':
                        if (userData.hostelName !== undefined) 
                            updateData.hostelName = userData.hostelName;
                        break;
                    case 'LIBRARIAN':
                        if (userData.librarySection !== undefined) 
                            updateData.librarySection = userData.librarySection;
                        break;
                    case 'LAB_INCHARGE':
                        if (userData.labName !== undefined) 
                            updateData.labName = userData.labName;
                        break;
                    case 'SPORTS_COORDINATOR':
                        if (userData.sportsCategory !== undefined) 
                            updateData.sportsCategory = userData.sportsCategory;
                        break;
                    case 'CULTURAL_COORDINATOR':
                        if (userData.culturalCategory !== undefined) 
                            updateData.culturalCategory = userData.culturalCategory;
                        break;
                    case 'ACADEMIC_COORDINATOR':
                        if (userData.academicProgram !== undefined) 
                            updateData.academicProgram = userData.academicProgram;
                        break;
                    default:
                        // Ensure moderator with unknown type still gets a department
                        if (!updateData.department || updateData.department === "No Department Set") {
                            updateData.department = userData.department || "General Department";
                        }
                        break;
                }
            } else {
                console.warn('Moderator role without moderatorType specified');
                // Ensure department is set even without moderator type
                if (!updateData.department || updateData.department === "No Department Set") {
                    updateData.department = userData.department || "General Department";
                }
            }
        }

        console.log('Final update data being sent to server:', JSON.stringify(updateData, null, 2));
        
        return api.put(`/users/${id}`, updateData)
            .then(response => {
                console.log('Update response received:', response.data);
                console.log('User roles in response:', response.data.roles);
                
                // Create an enhanced user object with our department information
                const updatedUser = {
                    ...response.data,
                    department: originalDepartment.name || updateData.department,
                    departmentId: originalDepartment.id || updateData.departmentId
                };
                
                // Set the response data to our enhanced object
                response.data = updatedUser;
                
                console.log('Enhanced updated user data:', updatedUser);
                return response;
            })
            .catch(error => {
                console.error('Error updating user:', error.response?.data || error.message);
                console.error('Error status:', error.response?.status);
                console.error('Error response data:', JSON.stringify(error.response?.data, null, 2));
                console.error('Full request that caused error:', updateData);
                throw error;
            });
    }

    delete(id) {
        return api.delete(`/users/${id}`);
    }

    getCurrentUser() {
        console.log('Getting current user profile data');
        return api.get('/users/me')
            .then(response => {
                console.log('Retrieved current user profile data:', response.data);
                return response;
            })
            .catch(error => {
                console.error('Error getting current user profile:', error);
                throw error;
            });
    }

    updateProfile(userId, updateData) {
        console.log(`Updating profile for user ${userId}:`, updateData);
        return api.put(`/users/${userId}`, updateData);
    }

    updateProfileWithAvatar(userId, updateData, avatarFile) {
        console.log(`Updating profile with avatar for user ${userId}`);
        const formData = new FormData();
        
        // Add profile data to FormData
        if (updateData) {
            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined && updateData[key] !== null) {
                    formData.append(key, updateData[key]);
                }
            });
        }
        
        // Add avatar file if provided
        if (avatarFile) {
            formData.append('file', avatarFile);
        }
        
        return api.post(`/users/${userId}/profile-update`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }

    uploadAvatar = async (userId, formData) => {
        const res = await api.post(`/users/${userId}/avatar`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : ''}`
            }
        });
        return res.data;
    };

    getAllModeratorsByType(type) {
        // This method is used to filter moderators by their specific type
        // It's especially important for course management where we want to show only 
        // TEACHER type moderators, not hostel wardens, librarians, or lab incharges
        console.log(`Fetching moderators of type: ${type}`);
        const url = type ? `/api/users/moderators?type=${type}` : '/api/users/moderators';
        return axios.get(url, { headers: authHeader() });
    }

    getModeratorBoard() {
        console.log('Getting moderator board data');
        return api.get('/moderator')
            .then(response => {
                console.log('Retrieved moderator board data:', response.data);
                return response;
            })
            .catch(error => {
                console.error('Error getting moderator board:', error);
                // Return a default response if the endpoint doesn't exist
                // This ensures the UI doesn't break
                return { data: { message: "Moderator Board" } };
            });
    }

    changePassword(currentPassword, newPassword) {
        return api.post('/auth/change-password', { currentPassword, newPassword });
    }

    getAllRoles() {
        // Try to use the correct endpoint, check common patterns
        return api.get('/users/roles')
            .catch(error => {
                console.warn('Failed to fetch roles from /users/roles, trying alternative paths...');
                // Try alternative path
                return api.get('/auth/roles')
                    .catch(error => {
                        console.warn('Failed to fetch roles from /auth/roles, returning default roles');
                        // Return empty array to trigger fallback
                        return { data: [] };
                    });
            });
    }

    getRoles() {
        // First try to get from the dedicated roles endpoint
        return this.getAllRoles()
            .then(response => {
                if (response.data && response.data.length > 0) {
                    return response;
                }
                // If that fails or returns empty, return hardcoded default roles
                return {
                    data: ['ROLE_ADMIN', 'ROLE_MODERATOR', 'ROLE_USER']
                };
            })
            .catch(() => {
                // Fallback to hardcoded roles in case of error
                return {
                    data: ['ROLE_ADMIN', 'ROLE_MODERATOR', 'ROLE_USER']
                };
            });
    }

    getAllModeratorTypes() {
        return api.get('/users/moderator-types')
            .then(response => response.data)
            .catch(error => {
                console.error('Error fetching moderator types:', error);
                throw error;
            });
    }

    getAllActivityLogs() {
        return api.get('/activity-logs')
            .then(response => response.data)
            .catch(error => {
                console.error('Error fetching activity logs:', error);
                throw error;
            });
    }

    getUsersPaginated(params = {}) {
        // params: { page, size, sort, username, email, department, role }
        return api.get('/users', { params })
            .then(response => {
                // Ensure each user has a department field
                if (response.data && response.data.content) {
                    response.data.content = response.data.content.map(user => {
                        // If department is missing or null, add a default value
                        if (!user.hasOwnProperty('department') || user.department === null || user.department === '') {
                            if (user.departmentId) {
                                // If we know the departmentId but not the name, we'll need to get it somehow
                                console.log(`User ${user.username} has departmentId ${user.departmentId} but no department name`);
                                // You could add a placeholder and fetch the department name separately if needed
                                user.department = 'No Department';
                            } else {
                                user.department = 'No Department';
                            }
                        }
                        return user;
                    });
                }
                return response;
            });
    }
}

export default new UserService(); 
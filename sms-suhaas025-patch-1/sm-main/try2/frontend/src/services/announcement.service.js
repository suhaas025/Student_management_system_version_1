import api from './api.service';
import authService from './auth.service';
// Remove any axios import if it's not being used
// import axios from 'axios';  
// Remove auth-header import if it's not being used
// import authHeader from './auth-header';

// Remove any hardcoded API_URL constants
// const API_URL = 'http://localhost:8080/api/announcements';

// Track API availability
let isApiAvailable = true;

// Helper function to get auth headers for requests
const getAuthHeader = () => {
    const token = authService.getToken();
    if (!token) {
        console.error('No authentication token available for announcement service request');
        return {};
    }
    return { Authorization: `Bearer ${token}` };
};

class AnnouncementService {
    // Test connection method that can be called when the app loads
    async checkApiAvailability() {
        if (!isApiAvailable) {
            console.log('API was previously marked as unavailable, using fallback mode');
            return false;
        }
        
        try {
            console.log('Testing announcement API connection...');
            const response = await api.get('/announcements', { headers: getAuthHeader() });
            console.log('Announcement API test successful:', response.data);
            isApiAvailable = true;
            return true;
        } catch (error) {
            console.error('Announcement API test failed:', error);
            isApiAvailable = false;
            console.log('Switching to fallback mode for announcements');
            return false;
        }
    }

    testBackendConnection() {
        return api.get('/announcements', { headers: getAuthHeader() })
            .then(response => {
                console.log('Backend connection successful!', response);
                isApiAvailable = true;
                return { connected: true, data: response.data };
            })
            .catch(error => {
                console.error('Backend connection failed:', error);
                isApiAvailable = false;
                return { connected: false, error };
            });
    }

    getAllAnnouncements() {
        console.log('Fetching all announcements');
        
        return api.get('/announcements', { headers: getAuthHeader() })
            .then(response => {
                // Ensure the response is properly formatted
                console.log(`Retrieved ${response.data?.length || 0} announcements`);
                
                if (Array.isArray(response.data)) {
                    console.log('Announcement data properly formatted');
                    return response;
                } else {
                    console.warn('Announcement data is not an array, will create one:', response.data);
                    
                    // If response.data exists but is not an array, try to fix it
                    if (response.data) {
                        if (typeof response.data === 'object') {
                            // If it's a single object, wrap it in an array
                            return { ...response, data: [response.data] };
                        } else {
                            // If it's something else entirely, return empty array
                            return { ...response, data: [] };
                        }
                    } else {
                        // If no data at all, return empty array
                        return { ...response, data: [] };
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching announcements:', error);
                console.log('Falling back to local storage for announcements');
                
                if (error.response?.status === 401) {
                    console.error('Authentication error (401) when fetching announcements');
                    // Try to refresh token or redirect to login
                    if (localStorage.getItem('user')) {
                        console.log('User exists in localStorage, will try to continue');
                    }
                }
                
                // Try to use the fallback method
                return this.getAllAnnouncementsFallback()
                    .then(fallbackResponse => {
                        console.log(`Retrieved ${fallbackResponse.data?.length || 0} announcements from fallback`);
                        return fallbackResponse;
                    })
                    .catch(fallbackError => {
                        console.error('Fallback also failed:', fallbackError);
                        // Create and return some sample announcements
                        const samples = this.createSampleAnnouncements();
                        return { data: samples };
                    });
            });
    }

    getAnnouncementById(id) {
        return api.get(`/announcements/${id}`, { headers: getAuthHeader() });
    }

    createAnnouncement(announcementData) {
        return api.post('/announcements', announcementData, { headers: getAuthHeader() });
    }

    updateAnnouncement(id, announcementData) {
        return api.put(`/announcements/${id}`, announcementData, { headers: getAuthHeader() });
    }

    deleteAnnouncement(id) {
        return api.delete(`/announcements/${id}`, { headers: getAuthHeader() });
    }

    getAnnouncementsByRole(role) {
        console.log(`Fetching announcements for role: ${role}`);
        return api.get(`/announcements/role/${role}`, { headers: getAuthHeader() })
            .then(response => {
                console.log(`Retrieved ${response.data.length} announcements for role ${role}`);
                return response;
            })
            .catch(error => {
                console.error(`Error fetching announcements for role ${role}:`, error);
                console.log('Falling back to local storage for role-based announcements');
                
                // Return all announcements from fallback and filter by role
                return this.getAllAnnouncementsFallback()
                    .then(fallbackResponse => {
                        const allAnnouncements = fallbackResponse.data || [];
                        
                        // Filter by role if possible (if targetRole property exists)
                        const filteredAnnouncements = allAnnouncements.filter(announcement => 
                            !announcement.targetRole || 
                            announcement.targetRole === 'ALL' ||
                            announcement.targetRole === role ||
                            announcement.targetRole.includes(role)
                        );
                        
                        console.log(`Filtered ${filteredAnnouncements.length} announcements for role ${role} from fallback`);
                        return { data: filteredAnnouncements };
                    })
                    .catch(fallbackError => {
                        console.error('Role-based fallback also failed:', fallbackError);
                        // Create and return some sample announcements
                        const samples = this.createSampleAnnouncements();
                        return { data: samples };
                    });
            });
    }

    getUnreadAnnouncementsCount() {
        console.log('Fetching unread announcements count');
        // Read storage for read announcements
        const readAnnouncements = JSON.parse(localStorage.getItem('readAnnouncements') || '[]');
        
        // Get all announcements and filter for unread
        return this.getAllAnnouncements()
            .then(response => {
                const announcements = response.data || [];
                const unreadCount = announcements.filter(a => 
                    !readAnnouncements.includes(a.id) && 
                    (a.isActive === true || a.isActive === 'true' || a.isActive === undefined)
                ).length;
                
                console.log(`Unread announcements count: ${unreadCount}`);
                return { data: unreadCount };
            })
            .catch(error => {
                console.error('Error calculating unread announcements:', error);
                return { data: 0 };
            });
    }

    markAsRead(announcementId) {
        // Get currently read announcements
        const readAnnouncements = JSON.parse(localStorage.getItem('readAnnouncements') || '[]');
        
        // Add this announcement if not already there
        if (!readAnnouncements.includes(announcementId)) {
            readAnnouncements.push(announcementId);
            localStorage.setItem('readAnnouncements', JSON.stringify(readAnnouncements));
        }
        
        return Promise.resolve({ success: true });
    }

    markAllAsRead(announcements) {
        // Get currently read announcements
        const readAnnouncements = JSON.parse(localStorage.getItem('readAnnouncements') || '[]');
        
        // Add all announcement IDs
        const updatedReadList = [
            ...new Set([...readAnnouncements, ...announcements.map(a => a.id)])
        ];
        
        localStorage.setItem('readAnnouncements', JSON.stringify(updatedReadList));
        return Promise.resolve({ success: true });
    }

    // Helper method to create sample announcements
    createSampleAnnouncements() {
        console.log('Creating sample announcements in localStorage');
        
        // Create sample announcements
        const sampleAnnouncements = [
            {
                id: 1001,
                title: "Welcome to the New Semester",
                message: "Welcome to the Spring 2025 semester! We hope you have a productive and enjoyable academic term. Please review your course schedule and ensure all enrollments are correct.",
                targetRole: "ROLE_USER",
                isUrgent: false,
                isActive: true,
                startDate: new Date().toISOString(),
                endDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: null,
                createdById: 1,
                createdByUsername: "admin"
            },
            {
                id: 1002,
                title: "System Maintenance Notice",
                message: "The student portal will be unavailable for scheduled maintenance on Sunday from 2:00 AM to 5:00 AM. Please plan accordingly and complete any urgent tasks before this time.",
                targetRole: "ROLE_USER",
                isUrgent: true,
                isActive: true,
                startDate: new Date().toISOString(),
                endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
                createdAt: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
                updatedAt: null,
                createdById: 1,
                createdByUsername: "admin"
            },
            {
                id: 1003,
                title: "Course Registration Deadline",
                message: "Course registration for the current semester ends on Friday at 11:59 PM. Make sure to complete your enrollments before the deadline to avoid late registration fees.",
                targetRole: "ROLE_USER",
                isUrgent: true,
                isActive: true,
                startDate: new Date().toISOString(),
                endDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
                createdAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
                updatedAt: null,
                createdById: 1,
                createdByUsername: "admin"
            },
            {
                id: 1004,
                title: "Assignment Submission Guidelines from Teacher",
                message: "This message is from your teacher. Please follow the formatting guidelines for all assignments as outlined in the course syllabus. Assignments not following these guidelines will be returned for correction.",
                targetRole: "ROLE_USER",
                isUrgent: false,
                isActive: true,
                startDate: new Date().toISOString(),
                endDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: null,
                createdById: 2,
                createdByUsername: "teacher"
            }
        ];
        
        // Ensure booleans are properly typed before saving
        const typeSafeAnnouncements = sampleAnnouncements.map(announcement => ({
            ...announcement,
            isUrgent: Boolean(announcement.isUrgent),
            urgent: Boolean(announcement.isUrgent),
            isActive: Boolean(announcement.isActive),
            active: Boolean(announcement.isActive)
        }));
        
        // Save to localStorage
        localStorage.setItem('announcements', JSON.stringify(typeSafeAnnouncements));
        
        console.log('Created sample announcements with explicit boolean types:', typeSafeAnnouncements);
        return typeSafeAnnouncements;
    }

    // Fallback methods in case the backend API isn't implemented yet
    // These methods use local storage to simulate persistence
    getAllAnnouncementsFallback() {
        const announcements = localStorage.getItem('announcements');
        let announcementsList = announcements ? JSON.parse(announcements) : [];
        
        // If there are no announcements, create some default ones
        if (announcementsList.length === 0) {
            announcementsList = this.createSampleAnnouncements();
        }
        
        return Promise.resolve({
            data: announcementsList
        });
    }

    createAnnouncementFallback(data) {
        return new Promise((resolve) => {
            const announcements = localStorage.getItem('announcements');
            const announcementsList = announcements ? JSON.parse(announcements) : [];
            
            // Explicitly check both urgent properties and consolidate them
            const isUrgentValue = Boolean(data.isUrgent || data.urgent || false);
            console.log("Service creating announcement with urgent status:", isUrgentValue, {
                dataUrgent: data.isUrgent,
                dataUrgentType: typeof data.isUrgent,
                urgent: data.urgent,
                urgentType: typeof data.urgent
            });
            
            // Ensure booleans are properly set
            const sanitizedData = {
                ...data,
                isUrgent: isUrgentValue,
                urgent: isUrgentValue, // Set both for compatibility
                isActive: Boolean(data.isActive || data.active || true),
                active: Boolean(data.isActive || data.active || true)
            };
            
            // Create a new announcement with an ID and timestamp
            const newAnnouncement = {
                ...sanitizedData,
                id: Date.now(),
                createdAt: new Date().toISOString(),
                createdBy: 'Admin'
            };
            
            console.log('Creating new announcement in localStorage:', newAnnouncement);
            
            // Add to list and save
            announcementsList.push(newAnnouncement);
            localStorage.setItem('announcements', JSON.stringify(announcementsList));
            
            resolve({ data: newAnnouncement });
        });
    }

    updateAnnouncementFallback(id, data) {
        return new Promise((resolve) => {
            const announcements = localStorage.getItem('announcements');
            let announcementsList = announcements ? JSON.parse(announcements) : [];
            
            console.log('Updating announcement in localStorage:', { id, data });
            
            // Explicitly check both urgent properties and consolidate them
            const isUrgentValue = Boolean(data.isUrgent || data.urgent || false);
            console.log("Service updating announcement with urgent status:", isUrgentValue, {
                dataUrgent: data.isUrgent,
                dataUrgentType: typeof data.isUrgent,
                urgent: data.urgent,
                urgentType: typeof data.urgent
            });
            
            // Ensure booleans are properly set
            const sanitizedData = {
                ...data,
                isUrgent: isUrgentValue,
                urgent: isUrgentValue, // Set both for compatibility
                isActive: Boolean(data.isActive || data.active || true),
                active: Boolean(data.isActive || data.active || true)
            };
            
            // Find and update the announcement
            announcementsList = announcementsList.map(announcement => 
                announcement.id === parseInt(id) 
                    ? { 
                        ...announcement, 
                        ...sanitizedData, 
                        updatedAt: new Date().toISOString() 
                      } 
                    : announcement
            );
            
            localStorage.setItem('announcements', JSON.stringify(announcementsList));
            const updatedAnnouncement = announcementsList.find(a => a.id === parseInt(id));
            console.log('Updated announcement:', updatedAnnouncement);
            resolve({ data: updatedAnnouncement });
        });
    }

    deleteAnnouncementFallback(id) {
        return new Promise((resolve) => {
            const announcements = localStorage.getItem('announcements');
            let announcementsList = announcements ? JSON.parse(announcements) : [];
            
            // Filter out the announcement with the given ID
            announcementsList = announcementsList.filter(
                announcement => announcement.id !== parseInt(id)
            );
            
            localStorage.setItem('announcements', JSON.stringify(announcementsList));
            resolve({ data: { message: 'Announcement deleted successfully' } });
        });
    }

    // Add a new method to get all announcements for moderators
    getAll() {
        console.log('Getting all announcements for moderator dashboard');
        return api.get('/announcements');
    }
}

export default new AnnouncementService(); 
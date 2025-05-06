import axios from 'axios';
import authHeader from './auth-header';
import eventBus from '../utils/eventBus';

const API_URL = 'http://localhost:8080/api/dashboard-components';

class DashboardService {
  // Get all dashboard components (admin only)
  getAllComponents() {
    return axios.get(API_URL, { headers: authHeader() });
  }

  // Get dashboard components for the current user's roles
  getComponentsForRoles() {
    return axios.post(`${API_URL}/for-roles`, {}, { headers: authHeader() });
  }

  // Get components by parent ID (for nested menus)
  getComponentsByParent(parentId) {
    return axios.get(`${API_URL}/by-parent/${parentId}`, { headers: authHeader() });
  }

  // Create a new dashboard component
  async createComponent(componentData) {
    const response = await axios.post(API_URL, componentData, { headers: authHeader() });
    // Emit event for menu changes
    eventBus.emit('menu-items-changed', { action: 'create' });
    return response;
  }

  // Update an existing dashboard component
  async updateComponent(id, componentData) {
    const response = await axios.put(`${API_URL}/${id}`, componentData, { headers: authHeader() });
    // Emit event for menu changes
    eventBus.emit('menu-items-changed', { action: 'update', id });
    return response;
  }

  // Delete a dashboard component
  async deleteComponent(id) {
    const response = await axios.delete(`${API_URL}/${id}`, { headers: authHeader() });
    // Emit event for menu changes
    eventBus.emit('menu-items-changed', { action: 'delete', id });
    return response;
  }

  // Reorder dashboard components
  async reorderComponents(orderData) {
    const response = await axios.patch(`${API_URL}/reorder`, orderData, { headers: authHeader() });
    // Emit event for menu changes
    eventBus.emit('menu-items-changed', { action: 'reorder' });
    return response;
  }

  // Populate default menu items based on existing application routes
  async populateDefaultMenuItems() {
    try {
      console.log('Checking if default menu items need to be created...');
      
      // First check if there are any existing menu items
      const response = await this.getAllComponents();
      
      if (response.data && response.data.length > 0) {
        console.log(`Found ${response.data.length} existing menu items, skipping default creation.`);
        return { success: true, message: 'Menu items already exist' };
      }
      
      console.log('No existing menu items found. Creating defaults...');
      
      // Define the default menu items for all roles
      const defaultMenuItems = [
        // Admin Features
        {
          title: 'User Management',
          description: 'Create, edit, and manage user accounts and permissions',
          icon: 'Person',
          displayOrder: 1,
          visible: true,
          allowedRoles: ['ROLE_ADMIN'],
          frontendRoute: '/admin/users',
          backendEndpoint: '/api/users',
          componentType: 'MENU_ITEM',
          configJson: JSON.stringify({})
        },
        {
          title: 'Course Management',
          description: 'Create and manage courses, assignments, and materials',
          icon: 'School',
          displayOrder: 2,
          visible: true,
          allowedRoles: ['ROLE_ADMIN'],
          frontendRoute: '/admin/courses',
          backendEndpoint: '/api/courses',
          componentType: 'MENU_ITEM',
          configJson: JSON.stringify({})
        },
        {
          title: 'Grade Management',
          description: 'View and manage grades for all students',
          icon: 'Grade',
          displayOrder: 3,
          visible: true,
          allowedRoles: ['ROLE_ADMIN'],
          frontendRoute: '/admin/grades',
          backendEndpoint: '/api/grades',
          componentType: 'MENU_ITEM',
          configJson: JSON.stringify({})
        },
        {
          title: 'Reports',
          description: 'Generate reports and view analytics on student performance',
          icon: 'Assessment',
          displayOrder: 4,
          visible: true,
          allowedRoles: ['ROLE_ADMIN'],
          frontendRoute: '/admin/reports',
          backendEndpoint: '/api/reports',
          componentType: 'MENU_ITEM',
          configJson: JSON.stringify({})
        },
        {
          title: 'Announcements',
          description: 'Create and manage system-wide announcements and notifications',
          icon: 'Announcement',
          displayOrder: 5,
          visible: true,
          allowedRoles: ['ROLE_ADMIN'],
          frontendRoute: '/admin/announcements',
          backendEndpoint: '/api/announcements',
          componentType: 'MENU_ITEM',
          configJson: JSON.stringify({})
        },
        {
          title: 'Enrollment Management',
          description: 'Approve, reject, and manage student course enrollments',
          icon: 'Assignment',
          displayOrder: 6,
          visible: true,
          allowedRoles: ['ROLE_ADMIN'],
          frontendRoute: '/admin/enrollments',
          backendEndpoint: '/api/enrollments',
          componentType: 'MENU_ITEM',
          configJson: JSON.stringify({})
        },
        {
          title: 'Activity Logs',
          description: 'View system activity logs and user actions',
          icon: 'History',
          displayOrder: 7,
          visible: true,
          allowedRoles: ['ROLE_ADMIN'],
          frontendRoute: '/admin/activity-logs',
          backendEndpoint: '/api/activity-logs',
          componentType: 'MENU_ITEM',
          configJson: JSON.stringify({})
        },
        {
          title: 'Department Management',
          description: 'Manage academic departments and their associations',
          icon: 'Business',
          displayOrder: 8,
          visible: true,
          allowedRoles: ['ROLE_ADMIN'],
          frontendRoute: '/admin/departments',
          backendEndpoint: '/api/departments',
          componentType: 'MENU_ITEM',
          configJson: JSON.stringify({})
        },
        {
          title: 'Menu Management',
          description: 'Configure the application menu system',
          icon: 'Menu',
          displayOrder: 9,
          visible: true,
          allowedRoles: ['ROLE_ADMIN'],
          frontendRoute: '/admin/menu-management',
          backendEndpoint: '/api/dashboard-components',
          componentType: 'MENU_ITEM',
          configJson: JSON.stringify({})
        },
        
        // Moderator Features
        {
          title: 'Dashboard',
          description: 'Moderator dashboard with overview of courses and students',
          icon: 'Dashboard',
          displayOrder: 1,
          visible: true,
          allowedRoles: ['ROLE_MODERATOR'],
          frontendRoute: '/moderator/dashboard',
          componentType: 'MENU_ITEM',
          configJson: JSON.stringify({})
        },
        {
          title: 'Courses',
          description: 'Manage courses you are teaching',
          icon: 'School',
          displayOrder: 2,
          visible: true,
          allowedRoles: ['ROLE_MODERATOR'],
          frontendRoute: '/moderator/courses',
          backendEndpoint: '/api/moderator/courses',
          componentType: 'MENU_ITEM',
          configJson: JSON.stringify({})
        },
        {
          title: 'Grades',
          description: 'Manage student grades for your courses',
          icon: 'Grade',
          displayOrder: 3,
          visible: true,
          allowedRoles: ['ROLE_MODERATOR'],
          frontendRoute: '/moderator/grades',
          backendEndpoint: '/api/moderator/grades',
          componentType: 'MENU_ITEM',
          configJson: JSON.stringify({})
        },
        {
          title: 'Students',
          description: 'View and manage students in your courses',
          icon: 'People',
          displayOrder: 4,
          visible: true,
          allowedRoles: ['ROLE_MODERATOR'],
          frontendRoute: '/moderator/students',
          backendEndpoint: '/api/moderator/students',
          componentType: 'MENU_ITEM',
          configJson: JSON.stringify({})
        },
        {
          title: 'Announcements',
          description: 'Create announcements for your courses',
          icon: 'Announcement',
          displayOrder: 5,
          visible: true,
          allowedRoles: ['ROLE_MODERATOR'],
          frontendRoute: '/moderator/announcements',
          backendEndpoint: '/api/moderator/announcements',
          componentType: 'MENU_ITEM',
          configJson: JSON.stringify({})
        },
        
        // Student Features
        {
          title: 'Dashboard',
          description: 'Student dashboard with overview of courses and grades',
          icon: 'Dashboard',
          displayOrder: 1,
          visible: true,
          allowedRoles: ['ROLE_USER'],
          frontendRoute: '/student/dashboard',
          componentType: 'MENU_ITEM',
          configJson: JSON.stringify({})
        },
        {
          title: 'My Courses',
          description: 'View your enrolled courses and materials',
          icon: 'MenuBook',
          displayOrder: 2,
          visible: true,
          allowedRoles: ['ROLE_USER'],
          frontendRoute: '/student/courses',
          backendEndpoint: '/api/student/courses',
          componentType: 'MENU_ITEM',
          configJson: JSON.stringify({})
        },
        {
          title: 'My Grades',
          description: 'View your grades for all courses',
          icon: 'Grade',
          displayOrder: 3,
          visible: true,
          allowedRoles: ['ROLE_USER'],
          frontendRoute: '/student/grades',
          backendEndpoint: '/api/student/grades',
          componentType: 'MENU_ITEM',
          configJson: JSON.stringify({})
        },
        {
          title: 'Course Registration',
          description: 'Browse and register for available courses',
          icon: 'AddCircle',
          displayOrder: 4,
          visible: true,
          allowedRoles: ['ROLE_USER'],
          frontendRoute: '/student/registration',
          backendEndpoint: '/api/student/registration',
          componentType: 'MENU_ITEM',
          configJson: JSON.stringify({})
        },
        
        // Common Features
        {
          title: 'Profile',
          description: 'View and update your user profile',
          icon: 'AccountCircle',
          displayOrder: 1,
          visible: true,
          allowedRoles: ['ROLE_ADMIN', 'ROLE_MODERATOR', 'ROLE_USER'],
          frontendRoute: '/profile',
          backendEndpoint: '/api/users/me',
          componentType: 'MENU_ITEM',
          configJson: JSON.stringify({})
        }
      ];
      
      // Create each menu item
      const results = [];
      for (const item of defaultMenuItems) {
        try {
          // Ensure any JSON fields are properly stringified
          const itemToSend = {
            ...item,
            configJson: typeof item.configJson === 'object' ? JSON.stringify(item.configJson) : item.configJson,
            themeJson: typeof item.themeJson === 'object' ? JSON.stringify(item.themeJson) : item.themeJson,
            permissionsJson: typeof item.permissionsJson === 'object' ? JSON.stringify(item.permissionsJson) : item.permissionsJson,
            translationsJson: typeof item.translationsJson === 'object' ? JSON.stringify(item.translationsJson) : item.translationsJson
          };
          
          const result = await this.createComponent(itemToSend);
          results.push(result.data);
          console.log(`Created menu item: ${item.title}`);
        } catch (err) {
          console.error(`Failed to create menu item ${item.title}:`, err);
        }
      }
      
      // At the end of the method, after successful creation:
      eventBus.emit('menu-items-changed', { action: 'populate' });
      
      return { 
        success: true, 
        message: `Created ${results.length} default menu items`, 
        data: results 
      };
    } catch (err) {
      console.error('Error populating default menu items:', err);
      return { 
        success: false, 
        message: 'Failed to populate default menu items', 
        error: err.message 
      };
    }
  }
}

export default new DashboardService(); 
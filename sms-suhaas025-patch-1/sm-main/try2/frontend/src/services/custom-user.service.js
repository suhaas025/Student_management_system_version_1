import api from './api.service';
import userService from './user.service';
import authService from './auth.service';

class CustomUserService {
  constructor() {
    this.cachedProfileKey = 'user_profile_cache';
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour in ms
    this.userMetadataKey = 'user_metadata';
    this.metadataExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  async getCurrentUser() {
    try {
      console.log('CustomUserService: Fetching current user profile data');
      
      // Get stored user for fallback
      const storedUser = authService.getCurrentUser();
      
      // Try to get from cache first for immediate display
      const cachedData = this._getCachedProfileData();
      if (cachedData) {
        console.log('CustomUserService: Found cached profile data:', cachedData);
      }
      
      try {
        // Try the /users/me endpoint first
        const response = await userService.getCurrentUser();
        console.log('CustomUserService: Successfully fetched user profile data:', response.data);
        
        // Process the data
        const userData = this._processUserData(response.data);
        
        // Cache the data
        this._cacheProfileData(userData);
        
        // Update stored metadata for student fields
        if (userData && (userData.department || userData.degree || userData.yearOfStudy)) {
          this._saveUserMetadata({
            department: userData.department || '',
            degree: userData.degree || '',
            yearOfStudy: userData.yearOfStudy || ''
          });
        }
        
        return {
          success: true,
          data: userData,
          source: 'api'
        };
      } catch (error) {
        console.error('CustomUserService: Failed to fetch with /users/me endpoint:', error.response?.status);
        
        // Try direct ID endpoint as fallback
        if (storedUser && storedUser.id) {
          try {
            console.log('CustomUserService: Trying to fetch user by ID as fallback');
            const response = await userService.get(storedUser.id);
            
            if (response && response.data) {
              console.log('CustomUserService: Successfully fetched user data by ID');
              const userData = this._processUserData(response.data);
              this._cacheProfileData(userData);
              
              // Update stored metadata for student fields
              if (userData && (userData.department || userData.degree || userData.yearOfStudy)) {
                this._saveUserMetadata({
                  department: userData.department || '',
                  degree: userData.degree || '',
                  yearOfStudy: userData.yearOfStudy || ''
                });
              }
              
              return {
                success: true,
                data: userData,
                source: 'api',
                fallback: true
              };
            }
          } catch (fallbackError) {
            console.error('CustomUserService: Fallback fetch also failed', fallbackError);
          }
        }
        
        // At this point, all API endpoints failed
        // Try to use cached data and metadata

        if (cachedData) {
          console.log('CustomUserService: Using cached profile data');
          return {
            success: true,
            data: cachedData,
            source: 'cache'
          };
        }
        
        // If no cache, check if we have metadata stored for student fields
        const metadata = this._getUserMetadata();
        
        // Return the current user from auth as last resort, enriched with metadata
        if (storedUser) {
          console.log('CustomUserService: Using minimal auth data with metadata:', metadata);
          const minimalUserData = {
            ...storedUser,
            department: metadata?.department || '',
            degree: metadata?.degree || '',
            yearOfStudy: metadata?.yearOfStudy || ''
          };
          
          // Cache this minimal data for future use
          this._cacheProfileData(minimalUserData);
          
          return {
            success: false,
            data: minimalUserData,
            source: 'auth',
            error: error.message || 'Failed to load profile data'
          };
        }
        
        // Complete failure
        return {
          success: false,
          data: null,
          source: 'none',
          error: error.message || 'Failed to load profile data'
        };
      }
    } catch (error) {
      console.error('CustomUserService: Unexpected error in getCurrentUser:', error);
      
      // Final fallback - try to use cached data
      const cachedData = this._getCachedProfileData();
      if (cachedData) {
        return {
          success: true,
          data: cachedData,
          source: 'cache'
        };
      }
      
      const storedUser = authService.getCurrentUser();
      const metadata = this._getUserMetadata();
      
      if (storedUser) {
        const minimalUserData = {
          ...storedUser,
          department: metadata?.department || '',
          degree: metadata?.degree || '',
          yearOfStudy: metadata?.yearOfStudy || ''
        };
        
        return {
          success: false,
          data: minimalUserData,
          source: 'auth',
          error: error.message || 'Failed to load profile data'
        };
      }
      
      return {
        success: false,
        data: null,
        source: 'none',
        error: error.message || 'Failed to load profile data'
      };
    }
  }
  
  async updateProfile(userId, updateData) {
    try {
      console.log('CustomUserService: Updating profile for user:', userId);
      console.log('CustomUserService: Update data:', {...updateData, password: updateData.password ? '******' : undefined});
      
      // Save metadata before attempting server update
      // This ensures we keep the student fields even if the server update fails
      if (updateData.department || updateData.degree || updateData.yearOfStudy) {
        const metadata = this._getUserMetadata() || {};
        const updatedMetadata = {
          ...metadata,
          department: updateData.department || metadata.department || '',
          degree: updateData.degree || metadata.degree || '',
          yearOfStudy: updateData.yearOfStudy || metadata.yearOfStudy || '',
        };
        this._saveUserMetadata(updatedMetadata);
      }
      
      const response = await userService.updateProfile(userId, updateData);
      
      // Update the cache with new data
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        const cachedData = this._getCachedProfileData() || {};
        const updatedData = {
          ...cachedData,
          ...updateData,
          // Don't cache sensitive data
          currentPassword: undefined,
          newPassword: undefined
        };
        
        this._cacheProfileData(updatedData);
      }
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('CustomUserService: Error updating profile', error);
      
      // Update local cache anyway to preserve UI state
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        const cachedData = this._getCachedProfileData() || {};
        const updatedData = {
          ...cachedData,
          ...updateData,
          // Don't cache sensitive data
          currentPassword: undefined,
          newPassword: undefined
        };
        
        // Only cache if there's at least basic data
        if (updatedData.username && updatedData.email) {
          this._cacheProfileData(updatedData);
        }
      }
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update profile',
        status: error.response?.status,
        data: error.response?.data
      };
    }
  }
  
  // Helper methods
  _processUserData(userData) {
    if (!userData) return null;
    
    // Ensure department, degree, and yearOfStudy are defined
    const processedData = {
      ...userData,
      department: userData.department || '',
      degree: userData.degree || '',
      yearOfStudy: userData.yearOfStudy ? 
        (typeof userData.yearOfStudy === 'number' ? 
          userData.yearOfStudy.toString() : userData.yearOfStudy) : ''
    };
    
    console.log('CustomUserService: Processed user data with fields:', {
      department: processedData.department,
      degree: processedData.degree,
      yearOfStudy: processedData.yearOfStudy
    });
    
    return processedData;
  }
  
  _cacheProfileData(userData) {
    if (!userData) return;
    
    try {
      const cacheData = {
        data: userData,
        timestamp: Date.now()
      };
      localStorage.setItem(this.cachedProfileKey, JSON.stringify(cacheData));
      console.log('CustomUserService: Profile data cached successfully');
    } catch (err) {
      console.error('CustomUserService: Error caching profile data', err);
    }
  }
  
  _getCachedProfileData() {
    try {
      const cachedData = localStorage.getItem(this.cachedProfileKey);
      if (!cachedData) return null;
      
      const { data, timestamp } = JSON.parse(cachedData);
      
      // Check if cache is expired
      if (Date.now() - timestamp > this.cacheExpiry) {
        localStorage.removeItem(this.cachedProfileKey);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error('CustomUserService: Error retrieving cached profile data', err);
      return null;
    }
  }
  
  // Store just the student-specific metadata separately 
  // This allows us to persist this data even if the main profile cache expires
  _saveUserMetadata(metadata) {
    try {
      const data = {
        metadata,
        timestamp: Date.now()
      };
      localStorage.setItem(this.userMetadataKey, JSON.stringify(data));
      console.log('CustomUserService: User metadata saved:', metadata);
    } catch (err) {
      console.error('CustomUserService: Error saving user metadata', err);
    }
  }
  
  _getUserMetadata() {
    try {
      const data = localStorage.getItem(this.userMetadataKey);
      if (!data) return null;
      
      const { metadata, timestamp } = JSON.parse(data);
      
      // Check if metadata is expired
      if (Date.now() - timestamp > this.metadataExpiry) {
        localStorage.removeItem(this.userMetadataKey);
        return null;
      }
      
      return metadata;
    } catch (err) {
      console.error('CustomUserService: Error retrieving user metadata', err);
      return null;
    }
  }
  
  // Proxy other methods from the original userService
  getAll() {
    return userService.getAll();
  }
  
  get(id) {
    return userService.get(id);
  }
  
  getAllStudents() {
    return userService.getAllStudents();
  }
}

export default new CustomUserService(); 
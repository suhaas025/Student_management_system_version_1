import api from './api.service';
import axios from 'axios';
import authHeader from './auth-header';

const API_URL = 'http://localhost:8080/api/reports';

// Helper function to convert object to CSV
const objectToCSV = (data) => {
    const csvRows = [];

    // Get headers
    const headers = Object.keys(data[0]);
    csvRows.push(headers.join(','));

    // Add rows
    for (const row of data) {
        const values = headers.map(header => {
            const escaped = ('' + (row[header] || '')).replace(/"/g, '\\"');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
};

class ReportService {
    // Generate grade distribution report
    getGradeDistribution(filters = {}) {
        return api.post('/reports/grade-distribution', filters);
    }

    // Generate course performance report
    getCoursePerformance(filters = {}) {
        return api.post('/reports/course-performance', filters);
    }

    // Generate student performance report
    getStudentPerformance(filters = {}) {
        return api.post('/reports/student-performance', filters);
    }

    // Generate academic year comparison report
    getYearComparison(filters = {}) {
        return api.post('/reports/year-comparison', filters);
    }

    // Export data to CSV format
    exportCSV(data, filename) {
        console.log('Exporting data:', data);
        if (!data || data.length === 0) {
            console.error('No data to export');
            return;
        }

        // Convert to CSV
        const csvContent = objectToCSV(data);
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Get analytics data from backend (example for future backend integration)
    async getAnalyticsData(type, params) {
        console.log('Fetching analytics data:', type, params);
        try {
            const response = await axios.get(`/api/analytics/${type}`, { 
                headers: authHeader(),
                params 
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching analytics data:', error);
            throw error;
        }
    }
}

export default new ReportService(); 
import api from './api.service';

class StudentService {
    getAll() {
        return api.get('/api/students');
    }

    get(id) {
        return api.get(`/api/students/${id}`);
    }

    create(data) {
        return api.post('/api/students', data);
    }

    update(id, data) {
        return api.put(`/api/students/${id}`, data);
    }

    delete(id) {
        return api.delete(`/api/students/${id}`);
    }

    findByTitle(title) {
        return api.get(`/api/students?title=${title}`);
    }

    getStudentGrades(id) {
        return api.get(`/api/students/${id}/grades`);
    }

    getStudentCourses(id) {
        return api.get(`/api/students/${id}/courses`);
    }
}

export default new StudentService(); 
const API_BASE = 'http://localhost:3000/api';

export const Store = {
    // Session state (kept in memory/localStorage for quick access)
    _cache: {
        schools: null,
        students: null,
    },

    // ==================== ADMIN AUTH ====================
    isAdmin() {
        return localStorage.getItem('isAdmin') === 'true';
    },

    async login(username, password) {
        try {
            const res = await fetch(`${API_BASE}/auth/admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('isAdmin', 'true');
                return true;
            }
            return false;
        } catch (err) {
            // Fallback to hardcoded if server is down
            if (username === 'admin' && password === 'admin') {
                localStorage.setItem('isAdmin', 'true');
                return true;
            }
            return false;
        }
    },

    logout() {
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('currentSchoolId');
        localStorage.removeItem('currentSchool');
        localStorage.removeItem('currentStudentId');
        localStorage.removeItem('currentStudent');
        window.location.hash = '';
        window.location.reload();
    },

    // ==================== SCHOOL AUTH ====================
    async schoolLogin(login, password) {
        try {
            const res = await fetch(`${API_BASE}/auth/school`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login, password })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('currentSchoolId', data.school.id);
                localStorage.setItem('currentSchool', JSON.stringify(data.school));
                return data.school;
            }
            return null;
        } catch (err) {
            console.error('School login error:', err);
            return null;
        }
    },

    isSchool() {
        return !!localStorage.getItem('currentSchoolId');
    },

    getCurrentSchool() {
        const school = localStorage.getItem('currentSchool');
        return school ? JSON.parse(school) : null;
    },

    async refreshCurrentSchool() {
        const schoolId = localStorage.getItem('currentSchoolId');
        if (!schoolId) return null;
        try {
            const res = await fetch(`${API_BASE}/schools/${schoolId}`);
            const school = await res.json();
            localStorage.setItem('currentSchool', JSON.stringify(school));
            return school;
        } catch (err) {
            return this.getCurrentSchool();
        }
    },

    schoolLogout() {
        localStorage.removeItem('currentSchoolId');
        localStorage.removeItem('currentSchool');
        window.location.hash = '';
        window.location.reload();
    },

    // ==================== SCHOOL CRUD ====================
    async getSchools() {
        try {
            const res = await fetch(`${API_BASE}/schools`);
            const schools = await res.json();
            this._cache.schools = schools;
            return schools;
        } catch (err) {
            console.error('Failed to fetch schools:', err);
            return this._cache.schools || [];
        }
    },

    async addSchool(school) {
        try {
            const res = await fetch(`${API_BASE}/schools`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(school)
            });
            return await res.json();
        } catch (err) {
            console.error('Failed to add school:', err);
            return null;
        }
    },

    async deleteSchool(schoolId) {
        try {
            await fetch(`${API_BASE}/schools/${schoolId}`, { method: 'DELETE' });
            return true;
        } catch (err) {
            console.error('Failed to delete school:', err);
            return false;
        }
    },

    async updateSchool(schoolId, updatedData) {
        try {
            const res = await fetch(`${API_BASE}/schools/${schoolId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            const updated = await res.json();
            // Update cached current school if it's the same
            if (localStorage.getItem('currentSchoolId') == schoolId) {
                localStorage.setItem('currentSchool', JSON.stringify(updated));
            }
            return updated;
        } catch (err) {
            console.error('Failed to update school:', err);
            return null;
        }
    },

    async getSchoolById(schoolId) {
        try {
            const res = await fetch(`${API_BASE}/schools/${schoolId}`);
            return await res.json();
        } catch (err) {
            console.error('Failed to fetch school:', err);
            return null;
        }
    },

    // ==================== STUDENT CRUD ====================
    async getStudents(schoolId) {
        try {
            const res = await fetch(`${API_BASE}/schools/${schoolId}/students`);
            return await res.json();
        } catch (err) {
            console.error('Failed to fetch students:', err);
            return [];
        }
    },

    async addStudent(student) {
        try {
            const res = await fetch(`${API_BASE}/students`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(student)
            });
            return await res.json();
        } catch (err) {
            console.error('Failed to add student:', err);
            return null;
        }
    },

    async deleteStudent(studentId) {
        try {
            await fetch(`${API_BASE}/students/${studentId}`, { method: 'DELETE' });
            return true;
        } catch (err) {
            console.error('Failed to delete student:', err);
            return false;
        }
    },

    async updateStudent(studentId, updatedData) {
        try {
            const res = await fetch(`${API_BASE}/students/${studentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            return await res.json();
        } catch (err) {
            console.error('Failed to update student:', err);
            return null;
        }
    },

    async getStudentById(studentId) {
        try {
            const res = await fetch(`${API_BASE}/students/${studentId}`);
            return await res.json();
        } catch (err) {
            console.error('Failed to fetch student:', err);
            return null;
        }
    },

    // ==================== STUDENT AUTH ====================
    async studentLogin(login, password) {
        try {
            const res = await fetch(`${API_BASE}/auth/student`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login, password })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('currentStudentId', data.student.id);
                localStorage.setItem('currentStudent', JSON.stringify(data.student));
                return data.student;
            }
            return null;
        } catch (err) {
            console.error('Student login error:', err);
            return null;
        }
    },

    isStudent() {
        return !!localStorage.getItem('currentStudentId');
    },

    getCurrentStudent() {
        const student = localStorage.getItem('currentStudent');
        return student ? JSON.parse(student) : null;
    },

    studentLogout() {
        localStorage.removeItem('currentStudentId');
        localStorage.removeItem('currentStudent');
        window.location.hash = '';
        window.location.reload();
    },

    // ==================== LESSONS CRUD ====================
    async getLessons(schoolId) {
        try {
            const res = await fetch(`${API_BASE}/lessons?school_id=${schoolId}`);
            return await res.json();
        } catch (err) {
            console.error('Failed to fetch lessons:', err);
            return [];
        }
    },

    async getLesson(lessonId) {
        try {
            const res = await fetch(`${API_BASE}/lessons/${lessonId}`);
            return await res.json();
        } catch (err) {
            console.error('Failed to fetch lesson:', err);
            return null;
        }
    },

    async createLesson(lessonData) {
        try {
            const res = await fetch(`${API_BASE}/lessons`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lessonData)
            });
            return await res.json();
        } catch (err) {
            console.error('Failed to create lesson:', err);
            return null;
        }
    },

    async updateLesson(lessonId, lessonData) {
        try {
            const res = await fetch(`${API_BASE}/lessons/${lessonId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lessonData)
            });
            return await res.json();
        } catch (err) {
            console.error('Failed to update lesson:', err);
            return null;
        }
    },

    async deleteLesson(lessonId) {
        try {
            await fetch(`${API_BASE}/lessons/${lessonId}`, { method: 'DELETE' });
            return true;
        } catch (err) {
            console.error('Failed to delete lesson:', err);
            return false;
        }
    },

    // ==================== EXERCISES CRUD ====================
    async addExercise(lessonId, exerciseData) {
        try {
            const res = await fetch(`${API_BASE}/lessons/${lessonId}/exercises`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(exerciseData)
            });
            return await res.json();
        } catch (err) {
            console.error('Failed to add exercise:', err);
            return null;
        }
    },

    async updateExercise(lessonId, exerciseId, exerciseData) {
        try {
            const res = await fetch(`${API_BASE}/lessons/${lessonId}/exercises/${exerciseId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(exerciseData)
            });
            return await res.json();
        } catch (err) {
            console.error('Failed to update exercise:', err);
            return null;
        }
    },

    async deleteExercise(lessonId, exerciseId) {
        try {
            await fetch(`${API_BASE}/lessons/${lessonId}/exercises/${exerciseId}`, { method: 'DELETE' });
            return true;
        } catch (err) {
            console.error('Failed to delete exercise:', err);
            return false;
        }
    },

    // ==================== LESSON ASSIGNMENTS ====================
    async assignLesson(lessonId, studentIds) {
        try {
            const res = await fetch(`${API_BASE}/lessons/${lessonId}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_ids: studentIds })
            });
            return await res.json();
        } catch (err) {
            console.error('Failed to assign lesson:', err);
            return null;
        }
    },

    async unassignLesson(lessonId, studentId) {
        try {
            await fetch(`${API_BASE}/lessons/${lessonId}/assign/${studentId}`, { method: 'DELETE' });
            return true;
        } catch (err) {
            console.error('Failed to unassign lesson:', err);
            return false;
        }
    },

    // ==================== STUDENT PROGRESS ====================
    async getStudentLessons(studentId) {
        try {
            const res = await fetch(`${API_BASE}/progress/student/${studentId}/lessons`);
            return await res.json();
        } catch (err) {
            console.error('Failed to fetch student lessons:', err);
            return [];
        }
    },

    async getStudentLessonProgress(studentId, lessonId) {
        try {
            const res = await fetch(`${API_BASE}/progress/student/${studentId}/lessons/${lessonId}`);
            return await res.json();
        } catch (err) {
            console.error('Failed to fetch lesson progress:', err);
            return null;
        }
    },

    async startExercise(assignmentId, exerciseId) {
        try {
            const res = await fetch(`${API_BASE}/progress/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignment_id: assignmentId, exercise_id: exerciseId })
            });
            return await res.json();
        } catch (err) {
            console.error('Failed to start exercise:', err);
            return null;
        }
    },

    async completeExercise(assignmentId, exerciseId, result = {}) {
        try {
            const res = await fetch(`${API_BASE}/progress/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignment_id: assignmentId, exercise_id: exerciseId, result })
            });
            return await res.json();
        } catch (err) {
            console.error('Failed to complete exercise:', err);
            return null;
        }
    }
};

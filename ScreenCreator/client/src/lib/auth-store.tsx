import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_BASE = '/api';

type UserRole = 'admin' | 'school' | 'student' | null;

interface User {
    id?: number;
    role: UserRole;
    name?: string;
    login?: string;
    schoolId?: number;
    allowedGames?: string[];
    allowedTrainings?: string[];
    data?: Record<string, unknown>;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (role: 'admin' | 'school' | 'student', username: string, password: string) => Promise<boolean>;
    logout: () => void;
    isAdmin: () => boolean;
    isSchool: () => boolean;
    isStudent: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Restore session from localStorage on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('auth_user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch {
                localStorage.removeItem('auth_user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (role: 'admin' | 'school' | 'student', username: string, password: string): Promise<boolean> => {
        try {
            if (role === 'admin') {
                // Try API first, fallback to hardcoded
                try {
                    const res = await fetch(`${API_BASE}/auth/admin`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });
                    const data = await res.json();
                    if (data.success) {
                        const adminUser: User = { role: 'admin', name: 'Администратор' };
                        setUser(adminUser);
                        localStorage.setItem('auth_user', JSON.stringify(adminUser));
                        return true;
                    }
                } catch {
                    // Fallback for when server doesn't have the endpoint yet
                    if (username === 'admin' && password === 'admin') {
                        const adminUser: User = { role: 'admin', name: 'Администратор' };
                        setUser(adminUser);
                        localStorage.setItem('auth_user', JSON.stringify(adminUser));
                        return true;
                    }
                }
                return false;
            }

            if (role === 'school') {
                try {
                    const res = await fetch(`${API_BASE}/auth/school`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ login: username, password })
                    });
                    const data = await res.json();
                    if (data.success) {
                        const schoolUser: User = {
                            id: data.school.id,
                            role: 'school',
                            name: data.school.title,
                            login: data.school.login,
                            allowedTrainings: data.school.allowedTrainings || [],
                            data: data.school
                        };
                        setUser(schoolUser);
                        localStorage.setItem('auth_user', JSON.stringify(schoolUser));
                        return true;
                    }
                } catch (err) {
                    console.error('School login error:', err);
                }
                return false;
            }

            if (role === 'student') {
                try {
                    const res = await fetch(`${API_BASE}/auth/student`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ login: username, password })
                    });
                    const data = await res.json();
                    if (data.success) {
                        const studentUser: User = {
                            id: data.student.id,
                            role: 'student',
                            name: `${data.student.first_name} ${data.student.last_name}`,
                            login: data.student.login,
                            schoolId: data.student.school_id,
                            allowedGames: data.student.allowed_games || [],
                            data: data.student
                        };
                        setUser(studentUser);
                        localStorage.setItem('auth_user', JSON.stringify(studentUser));
                        return true;
                    }
                } catch (err) {
                    console.error('Student login error:', err);
                }
                return false;
            }

            return false;
        } catch (err) {
            console.error('Login error:', err);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('auth_user');
    };

    const isAdmin = () => user?.role === 'admin';
    const isSchool = () => user?.role === 'school';
    const isStudent = () => user?.role === 'student';

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, isAdmin, isSchool, isStudent }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

// API functions for admin operations
export const authApi = {
    async getSchools() {
        try {
            const res = await fetch(`${API_BASE}/schools`);
            return await res.json();
        } catch {
            return [];
        }
    },

    async addSchool(school: { title: string; login: string; password: string; allowedTrainings?: string[] }) {
        const res = await fetch(`${API_BASE}/schools`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(school)
        });
        return await res.json();
    },

    async updateSchool(id: number, data: { title?: string; login?: string; password?: string; allowedTrainings?: string[] }) {
        const res = await fetch(`${API_BASE}/schools/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    async deleteSchool(id: number) {
        await fetch(`${API_BASE}/schools/${id}`, { method: 'DELETE' });
    },

    async getStudents(schoolId: number) {
        try {
            const res = await fetch(`${API_BASE}/schools/${schoolId}/students`);
            return await res.json();
        } catch {
            return [];
        }
    },

    async addStudent(student: {
        school_id: number;
        first_name: string;
        last_name: string;
        login: string;
        password: string;
        allowed_games: string[];
    }) {
        const res = await fetch(`${API_BASE}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(student)
        });
        return await res.json();
    },

    async updateStudent(id: number, data: {
        first_name?: string;
        last_name?: string;
        login?: string;
        password?: string;
        allowed_games?: string[];
        notes?: string;
    }) {
        const res = await fetch(`${API_BASE}/students/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    async deleteStudent(id: number) {
        await fetch(`${API_BASE}/students/${id}`, { method: 'DELETE' });
    },

    // Trainings
    async getTrainings() {
        try {
            const res = await fetch(`${API_BASE}/trainings`);
            return await res.json();
        } catch {
            return [];
        }
    },

    // Assignments
    async getAssignments(filters?: { schoolId?: number; studentId?: number }) {
        try {
            const params = new URLSearchParams();
            if (filters?.schoolId) params.set('schoolId', filters.schoolId.toString());
            if (filters?.studentId) params.set('studentId', filters.studentId.toString());
            const res = await fetch(`${API_BASE}/assignments?${params}`);
            return await res.json();
        } catch {
            return [];
        }
    },

    async getAssignment(id: number) {
        const res = await fetch(`${API_BASE}/assignments/${id}`);
        return await res.json();
    },

    async createAssignment(assignment: {
        schoolId: number;
        studentId: number;
        title: string;
        scheduledDate: string;
        exercises: Array<{
            trainingId: string;
            parameters: Record<string, unknown>;
            requiredResult: { type: string; minValue?: number };
        }>;
    }) {
        const res = await fetch(`${API_BASE}/assignments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assignment)
        });
        return await res.json();
    },

    async updateAssignment(id: number, data: {
        title?: string;
        scheduledDate?: string;
        exercises?: Array<{
            trainingId: string;
            parameters: Record<string, unknown>;
            requiredResult: { type: string; minValue?: number };
        }>;
        status?: string;
    }) {
        const res = await fetch(`${API_BASE}/assignments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    async deleteAssignment(id: number) {
        await fetch(`${API_BASE}/assignments/${id}`, { method: 'DELETE' });
    },

    // Exercise Results
    async getAssignmentResults(assignmentId: number) {
        try {
            const res = await fetch(`${API_BASE}/assignments/${assignmentId}/results`);
            return await res.json();
        } catch {
            return [];
        }
    },

    async submitExerciseResult(assignmentId: number, result: {
        exerciseIndex: number;
        studentId: number;
        result: Record<string, unknown>;
        passed: boolean;
    }) {
        const res = await fetch(`${API_BASE}/assignments/${assignmentId}/results`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result)
        });
        return await res.json();
    },

    // Student Progress
    async getStudentProgress(studentId: number) {
        try {
            const res = await fetch(`${API_BASE}/students/${studentId}/progress`);
            return await res.json();
        } catch {
            return [];
        }
    },

    // Templates
    async getTemplates(schoolId?: number) {
        try {
            const url = schoolId ? `${API_BASE}/templates?schoolId=${schoolId}` : `${API_BASE}/templates`;
            const res = await fetch(url);
            return await res.json();
        } catch {
            return [];
        }
    },

    async createTemplate(template: {
        schoolId: number;
        name: string;
        exercises: Array<{
            trainingId: string;
            parameters: Record<string, unknown>;
            requiredResult: { type: string; minValue?: number };
        }>;
    }) {
        const res = await fetch(`${API_BASE}/templates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(template)
        });
        return await res.json();
    },

    async updateTemplate(id: number, data: {
        name?: string;
        exercises?: Array<{
            trainingId: string;
            parameters: Record<string, unknown>;
            requiredResult: { type: string; minValue?: number };
        }>;
    }) {
        const res = await fetch(`${API_BASE}/templates/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    async deleteTemplate(id: number) {
        await fetch(`${API_BASE}/templates/${id}`, { method: 'DELETE' });
    },

    // Course Templates
    async getCourseTemplates(schoolId: number) {
        try {
            const res = await fetch(`${API_BASE}/courses?schoolId=${schoolId}`);
            return await res.json();
        } catch {
            return [];
        }
    },

    async createCourseTemplate(courseTemplate: {
        schoolId: number;
        name: string;
        days: Array<{
            date: string | null;
            daysOffset: number | null;
            exercises: Array<{
                trainingId: string;
                parameters: Record<string, unknown>;
                requiredResult: { type: string; minValue?: number };
            }>;
        }>;
    }) {
        const res = await fetch(`${API_BASE}/courses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(courseTemplate)
        });
        return await res.json();
    },

    async updateCourseTemplate(id: number, data: {
        name?: string;
        days?: Array<{
            date: string | null;
            daysOffset: number | null;
            exercises: Array<{
                trainingId: string;
                parameters: Record<string, unknown>;
                requiredResult: { type: string; minValue?: number };
            }>;
        }>;
    }) {
        const res = await fetch(`${API_BASE}/courses/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    async deleteCourseTemplate(id: number) {
        await fetch(`${API_BASE}/courses/${id}`, { method: 'DELETE' });
    }
};

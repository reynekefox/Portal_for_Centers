import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";

const router = Router();

// File-based storage
const DATA_DIR = path.join(process.cwd(), "data");
const SCHOOLS_FILE = path.join(DATA_DIR, "schools.json");
const STUDENTS_FILE = path.join(DATA_DIR, "students.json");
const ASSIGNMENTS_FILE = path.join(DATA_DIR, "assignments.json");
const RESULTS_FILE = path.join(DATA_DIR, "results.json");
const TEMPLATES_FILE = path.join(DATA_DIR, "templates.json");
const ADMIN_FILE = path.join(DATA_DIR, "admin.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Admin settings interface
interface AdminSettings {
    username: string;
    password: string;
}

// Load/save admin settings
function loadAdminSettings(): AdminSettings {
    try {
        if (fs.existsSync(ADMIN_FILE)) {
            return JSON.parse(fs.readFileSync(ADMIN_FILE, "utf-8"));
        }
    } catch (e) {
        console.error("Error loading admin settings:", e);
    }
    // Default admin credentials
    return { username: "admin", password: "admin" };
}

function saveAdminSettings(settings: AdminSettings): void {
    fs.writeFileSync(ADMIN_FILE, JSON.stringify(settings, null, 2));
}

// ==================== INTERFACES ====================
interface School {
    id: number;
    title: string;
    login: string;
    password: string;
    allowedTrainings: string[];
    createdAt: string;
}

interface Student {
    id: number;
    schoolId: number;
    firstName: string;
    lastName: string;
    login: string;
    password: string;
    allowedGames: string[];
    createdAt: string;
}

interface Exercise {
    trainingId: string;
    parameters: Record<string, unknown>;
    requiredResult: {
        type: 'score' | 'accuracy' | 'time' | 'completion';
        minValue?: number;
    };
}

interface Assignment {
    id: number;
    schoolId: number;
    studentId: number;
    title: string;
    scheduledDate: string;
    exercises: Exercise[];
    status: 'pending' | 'in_progress' | 'completed';
    createdAt: string;
}

interface ExerciseResult {
    id: number;
    assignmentId: number;
    exerciseIndex: number;
    studentId: number;
    result: Record<string, unknown>;
    passed: boolean;
    completedAt: string;
}

interface Template {
    id: number;
    schoolId: number;
    name: string;
    exercises: Exercise[];
    createdAt: string;
}

interface CourseDay {
    date: string | null;
    daysOffset: number | null;
    exercises: Exercise[];
}

interface CourseTemplate {
    id: number;
    schoolId: number;
    name: string;
    days: CourseDay[];
    createdAt: string;
}

const COURSES_FILE = path.join(DATA_DIR, "courses.json");

// ==================== LOAD/SAVE FUNCTIONS ====================
function loadSchools(): School[] {
    try {
        if (fs.existsSync(SCHOOLS_FILE)) {
            const data = JSON.parse(fs.readFileSync(SCHOOLS_FILE, "utf-8"));
            // Migrate old schools without allowedTrainings
            return data.map((s: School) => ({
                ...s,
                allowedTrainings: s.allowedTrainings || []
            }));
        }
    } catch (e) {
        console.error("Error loading schools:", e);
    }
    return [];
}

function saveSchools(schools: School[]): void {
    fs.writeFileSync(SCHOOLS_FILE, JSON.stringify(schools, null, 2));
}

function loadStudents(): Student[] {
    try {
        if (fs.existsSync(STUDENTS_FILE)) {
            return JSON.parse(fs.readFileSync(STUDENTS_FILE, "utf-8"));
        }
    } catch (e) {
        console.error("Error loading students:", e);
    }
    return [];
}

function saveStudents(students: Student[]): void {
    fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2));
}

function loadAssignments(): Assignment[] {
    try {
        if (fs.existsSync(ASSIGNMENTS_FILE)) {
            return JSON.parse(fs.readFileSync(ASSIGNMENTS_FILE, "utf-8"));
        }
    } catch (e) {
        console.error("Error loading assignments:", e);
    }
    return [];
}

function saveAssignments(assignments: Assignment[]): void {
    fs.writeFileSync(ASSIGNMENTS_FILE, JSON.stringify(assignments, null, 2));
}

function loadResults(): ExerciseResult[] {
    try {
        if (fs.existsSync(RESULTS_FILE)) {
            return JSON.parse(fs.readFileSync(RESULTS_FILE, "utf-8"));
        }
    } catch (e) {
        console.error("Error loading results:", e);
    }
    return [];
}

function saveResults(results: ExerciseResult[]): void {
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
}

function loadTemplates(): Template[] {
    try {
        if (fs.existsSync(TEMPLATES_FILE)) {
            return JSON.parse(fs.readFileSync(TEMPLATES_FILE, "utf-8"));
        }
    } catch (e) {
        console.error("Error loading templates:", e);
    }
    return [];
}

function saveTemplates(templates: Template[]): void {
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2));
}

function loadCourses(): CourseTemplate[] {
    try {
        if (fs.existsSync(COURSES_FILE)) {
            return JSON.parse(fs.readFileSync(COURSES_FILE, "utf-8"));
        }
    } catch (e) {
        console.error("Error loading courses:", e);
    }
    return [];
}

function saveCourses(courses: CourseTemplate[]): void {
    fs.writeFileSync(COURSES_FILE, JSON.stringify(courses, null, 2));
}

// Auto-increment IDs
function getNextId(items: { id: number }[]): number {
    return items.length > 0 ? Math.max(...items.map(s => s.id)) + 1 : 1;
}

// ==================== TRAININGS REGISTRY ====================
const TRAININGS = [
    { id: 'stroop-test', name: 'Тест Струпа', path: '/stroop-test' },
    { id: 'schulte-table', name: 'Таблица Шульте', path: '/schulte-table' },
    { id: 'n-back', name: 'N-back', path: '/n-back' },
    { id: 'correction-test', name: 'Корректурная проба', path: '/correction-test' },
    { id: 'reaction-test', name: 'Тест реакции', path: '/reaction-test' },
    { id: 'munsterberg-test', name: 'Тест Мюнстенберга', path: '/munsterberg-test' },
    { id: 'alphabet-game', name: 'Алфавит', path: '/alphabet-game' },
    { id: 'calcudoku', name: 'Калькудоку', path: '/calcudoku' },
    { id: 'counting-game', name: 'Считалка', path: '/counting-game' },
    { id: 'speed-reading', name: 'Турбочтение', path: '/speed-reading' },
    { id: 'sequence-test', name: 'Последовательность', path: '/sequence-test' },
    { id: 'tower-of-hanoi', name: 'Ханойская башня', path: '/tower-of-hanoi' },
    { id: 'vocabulary-test', name: 'Словарный запас', path: '/vocabulary-test' },
    { id: 'auditory-test', name: 'Понимание на слух', path: '/auditory-test' },
    { id: 'visual-memory-test', name: 'Цепочки', path: '/visual-memory-test' },
    { id: 'pairs-test', name: 'Пары', path: '/pairs-test' },
    { id: 'fly-test', name: 'Муха', path: '/fly-test' },
    { id: 'anagram-test', name: 'Анаграммы', path: '/anagram-test' },
    { id: 'math-test', name: 'Математика', path: '/math-test' },
    { id: 'magic-forest', name: 'Волшебный лес', path: '/magic-forest' },
    { id: 'start-test', name: 'Start-контроль', path: '/start-test' },

];

router.get("/trainings", (_req: Request, res: Response) => {
    res.json(TRAININGS);
});

// ==================== ADMIN AUTH ====================
router.post("/auth/admin", (req: Request, res: Response) => {
    const { username, password } = req.body;
    const adminSettings = loadAdminSettings();
    if (username === adminSettings.username && password === adminSettings.password) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// Change admin password
router.put("/admin/password", (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const adminSettings = loadAdminSettings();

    if (adminSettings.password !== currentPassword) {
        res.status(401).json({ success: false, error: "Неверный текущий пароль" });
        return;
    }

    if (!newPassword || newPassword.length < 4) {
        res.status(400).json({ success: false, error: "Новый пароль должен быть минимум 4 символа" });
        return;
    }

    adminSettings.password = newPassword;
    saveAdminSettings(adminSettings);
    res.json({ success: true });
});

// ==================== SCHOOL AUTH ====================
router.post("/auth/school", (req: Request, res: Response) => {
    const { login, password } = req.body;
    const schools = loadSchools();
    const school = schools.find(s => s.login === login && s.password === password);

    if (school) {
        res.json({ success: true, school });
    } else {
        res.json({ success: false });
    }
});

// ==================== STUDENT AUTH ====================
router.post("/auth/student", (req: Request, res: Response) => {
    const { login, password } = req.body;
    const students = loadStudents();
    const student = students.find(s => s.login === login && s.password === password);

    if (student) {
        res.json({
            success: true,
            student: {
                id: student.id,
                school_id: student.schoolId,
                first_name: student.firstName,
                last_name: student.lastName,
                login: student.login,
                allowed_games: student.allowedGames
            }
        });
    } else {
        res.json({ success: false });
    }
});

// ==================== SCHOOLS CRUD ====================
router.get("/schools", (_req: Request, res: Response) => {
    const schools = loadSchools();
    res.json(schools);
});

router.get("/schools/:id", (req: Request, res: Response) => {
    const schools = loadSchools();
    const school = schools.find(s => s.id === parseInt(req.params.id));
    if (school) {
        res.json(school);
    } else {
        res.status(404).json({ error: "School not found" });
    }
});

router.post("/schools", (req: Request, res: Response) => {
    const { title, login, password, allowedTrainings } = req.body;
    const schools = loadSchools();

    const newSchool: School = {
        id: getNextId(schools),
        title,
        login,
        password,
        allowedTrainings: allowedTrainings || [],
        createdAt: new Date().toISOString()
    };

    schools.push(newSchool);
    saveSchools(schools);
    res.json(newSchool);
});

router.put("/schools/:id", (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { title, login, password, allowedTrainings } = req.body;
    const schools = loadSchools();
    const index = schools.findIndex(s => s.id === id);

    if (index !== -1) {
        if (title !== undefined) schools[index].title = title;
        if (login !== undefined) schools[index].login = login;
        if (password !== undefined) schools[index].password = password;
        if (allowedTrainings !== undefined) schools[index].allowedTrainings = allowedTrainings;
        saveSchools(schools);
        res.json(schools[index]);
    } else {
        res.status(404).json({ error: "School not found" });
    }
});

router.delete("/schools/:id", (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    let schools = loadSchools();
    let students = loadStudents();
    let assignments = loadAssignments();

    schools = schools.filter(s => s.id !== id);
    students = students.filter(s => s.schoolId !== id);
    assignments = assignments.filter(a => a.schoolId !== id);

    saveSchools(schools);
    saveStudents(students);
    saveAssignments(assignments);
    res.json({ success: true });
});

// ==================== SCHOOL STATISTICS ====================
router.get("/schools/:id/statistics", (req: Request, res: Response) => {
    const schoolId = parseInt(req.params.id);
    const schools = loadSchools();
    const school = schools.find(s => s.id === schoolId);

    if (!school) {
        res.status(404).json({ error: "School not found" });
        return;
    }

    const students = loadStudents().filter(s => s.schoolId === schoolId);
    const assignments = loadAssignments().filter(a => a.schoolId === schoolId);
    const studentIds = students.map(s => s.id);
    const results = loadResults().filter(r => studentIds.includes(r.studentId));

    // Assignment statistics
    const assignmentsCompleted = assignments.filter(a => a.status === 'completed').length;
    const assignmentsInProgress = assignments.filter(a => a.status === 'in_progress').length;
    const assignmentsPending = assignments.filter(a => a.status === 'pending').length;

    // Exercise statistics
    const exercisesPassed = results.filter(r => r.passed).length;
    const exercisesFailed = results.filter(r => !r.passed).length;
    const exercisesTotal = results.length;
    const successRate = exercisesTotal > 0 ? Math.round((exercisesPassed / exercisesTotal) * 100) : 0;

    // Last activity
    const lastResult = results.length > 0
        ? results.reduce((latest, r) => new Date(r.completedAt) > new Date(latest.completedAt) ? r : latest)
        : null;

    // Top trainings
    const trainingCounts: Record<string, number> = {};
    assignments.forEach(a => {
        a.exercises.forEach(e => {
            trainingCounts[e.trainingId] = (trainingCounts[e.trainingId] || 0) + 1;
        });
    });

    const topTrainings = Object.entries(trainingCounts)
        .map(([id, count]) => {
            const training = TRAININGS.find(t => t.id === id);
            return { id, name: training?.name || id, count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // Students with most activity
    const studentActivity = students.map(s => {
        const studentResults = results.filter(r => r.studentId === s.id);
        const studentAssignments = assignments.filter(a => a.studentId === s.id);
        return {
            id: s.id,
            name: `${s.firstName} ${s.lastName}`,
            completedExercises: studentResults.filter(r => r.passed).length,
            totalAssignments: studentAssignments.length,
            completedAssignments: studentAssignments.filter(a => a.status === 'completed').length
        };
    }).sort((a, b) => b.completedExercises - a.completedExercises);

    res.json({
        studentsCount: students.length,
        assignmentsTotal: assignments.length,
        assignmentsCompleted,
        assignmentsInProgress,
        assignmentsPending,
        exercisesTotal,
        exercisesPassed,
        exercisesFailed,
        successRate,
        lastActivity: lastResult?.completedAt || school.createdAt,
        createdAt: school.createdAt,
        topTrainings,
        studentActivity
    });
});

// ==================== STUDENTS CRUD ====================
router.get("/schools/:schoolId/students", (req: Request, res: Response) => {
    const schoolId = parseInt(req.params.schoolId);
    const students = loadStudents().filter(s => s.schoolId === schoolId);

    const mapped = students.map(s => ({
        id: s.id,
        school_id: s.schoolId,
        first_name: s.firstName,
        last_name: s.lastName,
        login: s.login,
        password: s.password,
        allowed_games: s.allowedGames
    }));

    res.json(mapped);
});

router.get("/students/:id", (req: Request, res: Response) => {
    const students = loadStudents();
    const student = students.find(s => s.id === parseInt(req.params.id));

    if (student) {
        res.json({
            id: student.id,
            school_id: student.schoolId,
            first_name: student.firstName,
            last_name: student.lastName,
            login: student.login,
            password: student.password,
            allowed_games: student.allowedGames
        });
    } else {
        res.status(404).json({ error: "Student not found" });
    }
});

router.post("/students", (req: Request, res: Response) => {
    const { school_id, first_name, last_name, login, password, allowed_games } = req.body;
    const students = loadStudents();

    const newStudent: Student = {
        id: getNextId(students),
        schoolId: school_id,
        firstName: first_name,
        lastName: last_name,
        login,
        password,
        allowedGames: allowed_games || [],
        createdAt: new Date().toISOString()
    };

    students.push(newStudent);
    saveStudents(students);

    res.json({
        id: newStudent.id,
        school_id: newStudent.schoolId,
        first_name: newStudent.firstName,
        last_name: newStudent.lastName,
        login: newStudent.login,
        password: newStudent.password,
        allowed_games: newStudent.allowedGames
    });
});

router.put("/students/:id", (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { first_name, last_name, login, password, allowed_games } = req.body;
    const students = loadStudents();
    const index = students.findIndex(s => s.id === id);

    if (index !== -1) {
        if (first_name !== undefined) students[index].firstName = first_name;
        if (last_name !== undefined) students[index].lastName = last_name;
        if (login !== undefined) students[index].login = login;
        if (password !== undefined) students[index].password = password;
        if (allowed_games !== undefined) students[index].allowedGames = allowed_games;

        saveStudents(students);

        const s = students[index];
        res.json({
            id: s.id,
            school_id: s.schoolId,
            first_name: s.firstName,
            last_name: s.lastName,
            login: s.login,
            password: s.password,
            allowed_games: s.allowedGames
        });
    } else {
        res.status(404).json({ error: "Student not found" });
    }
});

router.delete("/students/:id", (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    let students = loadStudents();
    let assignments = loadAssignments();
    let results = loadResults();

    students = students.filter(s => s.id !== id);
    assignments = assignments.filter(a => a.studentId !== id);
    results = results.filter(r => r.studentId !== id);

    saveStudents(students);
    saveAssignments(assignments);
    saveResults(results);
    res.json({ success: true });
});

// ==================== ASSIGNMENTS CRUD ====================
router.get("/assignments", (req: Request, res: Response) => {
    const { schoolId, studentId } = req.query;
    let assignments = loadAssignments();

    if (schoolId) {
        assignments = assignments.filter(a => a.schoolId === parseInt(schoolId as string));
    }
    if (studentId) {
        assignments = assignments.filter(a => a.studentId === parseInt(studentId as string));
    }

    res.json(assignments);
});

router.get("/assignments/:id", (req: Request, res: Response) => {
    const assignments = loadAssignments();
    const assignment = assignments.find(a => a.id === parseInt(req.params.id));
    if (assignment) {
        res.json(assignment);
    } else {
        res.status(404).json({ error: "Assignment not found" });
    }
});

router.post("/assignments", (req: Request, res: Response) => {
    const { schoolId, studentId, title, scheduledDate, exercises } = req.body;
    const assignments = loadAssignments();

    const newAssignment: Assignment = {
        id: getNextId(assignments),
        schoolId,
        studentId,
        title,
        scheduledDate,
        exercises: exercises || [],
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    assignments.push(newAssignment);
    saveAssignments(assignments);
    res.json(newAssignment);
});

router.put("/assignments/:id", (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { title, scheduledDate, exercises, status } = req.body;
    const assignments = loadAssignments();
    const index = assignments.findIndex(a => a.id === id);

    if (index !== -1) {
        if (title !== undefined) assignments[index].title = title;
        if (scheduledDate !== undefined) assignments[index].scheduledDate = scheduledDate;
        if (exercises !== undefined) assignments[index].exercises = exercises;
        if (status !== undefined) assignments[index].status = status;
        saveAssignments(assignments);
        res.json(assignments[index]);
    } else {
        res.status(404).json({ error: "Assignment not found" });
    }
});

router.delete("/assignments/:id", (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    let assignments = loadAssignments();
    let results = loadResults();

    assignments = assignments.filter(a => a.id !== id);
    results = results.filter(r => r.assignmentId !== id);

    saveAssignments(assignments);
    saveResults(results);
    res.json({ success: true });
});

// ==================== EXERCISE RESULTS ====================
router.get("/assignments/:assignmentId/results", (req: Request, res: Response) => {
    const assignmentId = parseInt(req.params.assignmentId);
    const results = loadResults().filter(r => r.assignmentId === assignmentId);
    res.json(results);
});

router.post("/assignments/:assignmentId/results", (req: Request, res: Response) => {
    const assignmentId = parseInt(req.params.assignmentId);
    const { exerciseIndex, studentId, result, passed } = req.body;

    const results = loadResults();
    const assignments = loadAssignments();

    const newResult: ExerciseResult = {
        id: getNextId(results),
        assignmentId,
        exerciseIndex,
        studentId,
        result,
        passed,
        completedAt: new Date().toISOString()
    };

    results.push(newResult);
    saveResults(results);

    // Update assignment status
    const assignmentIndex = assignments.findIndex(a => a.id === assignmentId);
    if (assignmentIndex !== -1) {
        const assignment = assignments[assignmentIndex];
        const assignmentResults = results.filter(r => r.assignmentId === assignmentId);

        // Get unique passed exercise indices
        const passedExerciseIndices = new Set(
            assignmentResults.filter(r => r.passed).map(r => r.exerciseIndex)
        );

        if (passedExerciseIndices.size >= assignment.exercises.length) {
            assignments[assignmentIndex].status = 'completed';
        } else if (assignmentResults.length > 0) {
            assignments[assignmentIndex].status = 'in_progress';
        }
        saveAssignments(assignments);
    }

    res.json(newResult);
});

// ==================== STUDENT PROGRESS ====================
router.get("/students/:studentId/progress", (req: Request, res: Response) => {
    const studentId = parseInt(req.params.studentId);
    const assignments = loadAssignments().filter(a => a.studentId === studentId);
    const results = loadResults().filter(r => r.studentId === studentId);

    const progress = assignments.map(a => ({
        assignment: a,
        completedExercises: results.filter(r => r.assignmentId === a.id).length,
        totalExercises: a.exercises.length,
        passedExercises: results.filter(r => r.assignmentId === a.id && r.passed).length
    }));

    res.json(progress);
});

// ==================== TEMPLATES ====================
router.get("/templates", (req: Request, res: Response) => {
    const { schoolId } = req.query;
    let templates = loadTemplates();
    if (schoolId) {
        templates = templates.filter(t => t.schoolId === parseInt(schoolId as string));
    }
    res.json(templates);
});

router.get("/templates/:id", (req: Request, res: Response) => {
    const templates = loadTemplates();
    const template = templates.find(t => t.id === parseInt(req.params.id));
    if (template) {
        res.json(template);
    } else {
        res.status(404).json({ error: "Template not found" });
    }
});

router.post("/templates", (req: Request, res: Response) => {
    const { schoolId, name, exercises } = req.body;
    const templates = loadTemplates();

    const newTemplate: Template = {
        id: getNextId(templates),
        schoolId,
        name,
        exercises,
        createdAt: new Date().toISOString()
    };

    templates.push(newTemplate);
    saveTemplates(templates);
    res.status(201).json(newTemplate);
});

router.put("/templates/:id", (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { name, exercises } = req.body;
    const templates = loadTemplates();
    const index = templates.findIndex(t => t.id === id);
    if (index !== -1) {
        if (name !== undefined) templates[index].name = name;
        if (exercises !== undefined) templates[index].exercises = exercises;
        saveTemplates(templates);
        res.json(templates[index]);
    } else {
        res.status(404).json({ error: "Template not found" });
    }
});

router.delete("/templates/:id", (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    let templates = loadTemplates();
    templates = templates.filter(t => t.id !== id);
    saveTemplates(templates);
    res.json({ success: true });
});

// ==================== COURSE TEMPLATES ====================
router.get("/courses", (req: Request, res: Response) => {
    const { schoolId } = req.query;
    let courses = loadCourses();
    if (schoolId) {
        courses = courses.filter(c => c.schoolId === parseInt(schoolId as string));
    }
    res.json(courses);
});

router.get("/courses/:id", (req: Request, res: Response) => {
    const courses = loadCourses();
    const course = courses.find(c => c.id === parseInt(req.params.id));
    if (course) {
        res.json(course);
    } else {
        res.status(404).json({ error: "Course not found" });
    }
});

router.post("/courses", (req: Request, res: Response) => {
    const { schoolId, name, days } = req.body;
    const courses = loadCourses();

    const newCourse: CourseTemplate = {
        id: getNextId(courses),
        schoolId,
        name,
        days: days || [],
        createdAt: new Date().toISOString()
    };

    courses.push(newCourse);
    saveCourses(courses);
    res.status(201).json(newCourse);
});

router.put("/courses/:id", (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { name, days } = req.body;
    const courses = loadCourses();
    const index = courses.findIndex(c => c.id === id);
    if (index !== -1) {
        if (name !== undefined) courses[index].name = name;
        if (days !== undefined) courses[index].days = days;
        saveCourses(courses);
        res.json(courses[index]);
    } else {
        res.status(404).json({ error: "Course not found" });
    }
});

router.delete("/courses/:id", (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    let courses = loadCourses();
    courses = courses.filter(c => c.id !== id);
    saveCourses(courses);
    res.json({ success: true });
});

export default router;

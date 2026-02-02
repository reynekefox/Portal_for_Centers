import { Router, Request, Response } from "express";
import { db } from "../db";
import {
    schools, students, assignments, exerciseResults, templates, courseTemplates, adminSettings,
    type School, type Student, type Assignment, type ExerciseResult, type Template, type CourseTemplate
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

const router = Router();

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
router.post("/auth/admin", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const [admin] = await db.select().from(adminSettings).limit(1);

    if (admin && username === admin.username && password === admin.password) {
        res.json({ success: true });
    } else if (!admin && username === "admin" && password === "admin") {
        // Default admin if not in DB
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// Change admin password
router.put("/admin/password", async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const [admin] = await db.select().from(adminSettings).limit(1);
    const currentPwd = admin?.password || "admin";

    if (currentPwd !== currentPassword) {
        res.status(401).json({ success: false, error: "Неверный текущий пароль" });
        return;
    }

    if (!newPassword || newPassword.length < 4) {
        res.status(400).json({ success: false, error: "Новый пароль должен быть минимум 4 символа" });
        return;
    }

    if (admin) {
        await db.update(adminSettings).set({ password: newPassword }).where(eq(adminSettings.id, admin.id));
    } else {
        await db.insert(adminSettings).values({ username: "admin", password: newPassword });
    }
    res.json({ success: true });
});

// ==================== SCHOOL AUTH ====================
router.post("/auth/school", async (req: Request, res: Response) => {
    const { login, password } = req.body;
    const [school] = await db.select().from(schools).where(
        and(eq(schools.login, login), eq(schools.password, password))
    );

    if (school) {
        res.json({ success: true, school });
    } else {
        res.json({ success: false });
    }
});

// ==================== STUDENT AUTH ====================
router.post("/auth/student", async (req: Request, res: Response) => {
    const { login, password } = req.body;
    const [student] = await db.select().from(students).where(
        and(eq(students.login, login), eq(students.password, password))
    );

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
router.get("/schools", async (_req: Request, res: Response) => {
    const result = await db.select().from(schools);
    res.json(result);
});

router.get("/schools/:id", async (req: Request, res: Response) => {
    const [school] = await db.select().from(schools).where(eq(schools.id, parseInt(req.params.id)));
    if (school) {
        res.json(school);
    } else {
        res.status(404).json({ error: "School not found" });
    }
});

router.post("/schools", async (req: Request, res: Response) => {
    const { title, login, password, allowedTrainings } = req.body;
    const [newSchool] = await db.insert(schools).values({
        title,
        login,
        password,
        allowedTrainings: allowedTrainings || []
    }).returning();
    res.json(newSchool);
});

router.put("/schools/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { title, login, password, allowedTrainings } = req.body;

    const updateData: Partial<{ title: string; login: string; password: string; allowedTrainings: string[] }> = {};
    if (title !== undefined) updateData.title = title;
    if (login !== undefined) updateData.login = login;
    if (password !== undefined) updateData.password = password;
    if (allowedTrainings !== undefined) updateData.allowedTrainings = allowedTrainings;

    const [updated] = await db.update(schools).set(updateData).where(eq(schools.id, id)).returning();
    if (updated) {
        res.json(updated);
    } else {
        res.status(404).json({ error: "School not found" });
    }
});

router.delete("/schools/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    await db.delete(schools).where(eq(schools.id, id));
    res.json({ success: true });
});

// ==================== SCHOOL STATISTICS ====================
router.get("/schools/:id/statistics", async (req: Request, res: Response) => {
    const schoolId = parseInt(req.params.id);
    const [school] = await db.select().from(schools).where(eq(schools.id, schoolId));

    if (!school) {
        res.status(404).json({ error: "School not found" });
        return;
    }

    const schoolStudents = await db.select().from(students).where(eq(students.schoolId, schoolId));
    const schoolAssignments = await db.select().from(assignments).where(eq(assignments.schoolId, schoolId));
    const studentIds = schoolStudents.map(s => s.id);

    let results: ExerciseResult[] = [];
    if (studentIds.length > 0) {
        results = await db.select().from(exerciseResults).where(
            sql`${exerciseResults.studentId} IN (${sql.join(studentIds.map(id => sql`${id}`), sql`, `)})`
        );
    }

    const assignmentsCompleted = schoolAssignments.filter(a => a.status === 'completed').length;
    const assignmentsInProgress = schoolAssignments.filter(a => a.status === 'in_progress').length;
    const assignmentsPending = schoolAssignments.filter(a => a.status === 'pending').length;

    const exercisesPassed = results.filter(r => r.passed === 1).length;
    const exercisesFailed = results.filter(r => r.passed === 0).length;
    const exercisesTotal = results.length;
    const successRate = exercisesTotal > 0 ? Math.round((exercisesPassed / exercisesTotal) * 100) : 0;

    const lastResult = results.length > 0
        ? results.reduce((latest, r) => (r.completedAt && latest.completedAt && new Date(r.completedAt) > new Date(latest.completedAt)) ? r : latest)
        : null;

    const trainingCounts: Record<string, number> = {};
    schoolAssignments.forEach(a => {
        const exercises = a.exercises as Array<{ trainingId: string }>;
        exercises?.forEach(e => {
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

    const studentActivity = schoolStudents.map(s => {
        const studentResults = results.filter(r => r.studentId === s.id);
        const studentAssignments = schoolAssignments.filter(a => a.studentId === s.id);
        return {
            id: s.id,
            name: `${s.firstName} ${s.lastName}`,
            completedExercises: studentResults.filter(r => r.passed === 1).length,
            totalAssignments: studentAssignments.length,
            completedAssignments: studentAssignments.filter(a => a.status === 'completed').length
        };
    }).sort((a, b) => b.completedExercises - a.completedExercises);

    res.json({
        studentsCount: schoolStudents.length,
        assignmentsTotal: schoolAssignments.length,
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
router.get("/schools/:schoolId/students", async (req: Request, res: Response) => {
    const schoolId = parseInt(req.params.schoolId);
    const result = await db.select().from(students).where(eq(students.schoolId, schoolId));

    const mapped = result.map(s => ({
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

router.get("/students/:id", async (req: Request, res: Response) => {
    const [student] = await db.select().from(students).where(eq(students.id, parseInt(req.params.id)));

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

router.post("/students", async (req: Request, res: Response) => {
    const { school_id, first_name, last_name, login, password, allowed_games } = req.body;

    const [newStudent] = await db.insert(students).values({
        schoolId: school_id,
        firstName: first_name,
        lastName: last_name,
        login,
        password,
        allowedGames: allowed_games || []
    }).returning();

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

router.put("/students/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { first_name, last_name, login, password, allowed_games } = req.body;

    const updateData: Partial<{ firstName: string; lastName: string; login: string; password: string; allowedGames: string[] }> = {};
    if (first_name !== undefined) updateData.firstName = first_name;
    if (last_name !== undefined) updateData.lastName = last_name;
    if (login !== undefined) updateData.login = login;
    if (password !== undefined) updateData.password = password;
    if (allowed_games !== undefined) updateData.allowedGames = allowed_games;

    const [updated] = await db.update(students).set(updateData).where(eq(students.id, id)).returning();

    if (updated) {
        res.json({
            id: updated.id,
            school_id: updated.schoolId,
            first_name: updated.firstName,
            last_name: updated.lastName,
            login: updated.login,
            password: updated.password,
            allowed_games: updated.allowedGames
        });
    } else {
        res.status(404).json({ error: "Student not found" });
    }
});

router.delete("/students/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    await db.delete(students).where(eq(students.id, id));
    res.json({ success: true });
});

// ==================== ASSIGNMENTS CRUD ====================
router.get("/assignments", async (req: Request, res: Response) => {
    const { schoolId, studentId } = req.query;

    let result;
    if (schoolId && studentId) {
        result = await db.select().from(assignments).where(
            and(eq(assignments.schoolId, parseInt(schoolId as string)), eq(assignments.studentId, parseInt(studentId as string)))
        );
    } else if (schoolId) {
        result = await db.select().from(assignments).where(eq(assignments.schoolId, parseInt(schoolId as string)));
    } else if (studentId) {
        result = await db.select().from(assignments).where(eq(assignments.studentId, parseInt(studentId as string)));
    } else {
        result = await db.select().from(assignments);
    }

    res.json(result);
});

router.get("/assignments/:id", async (req: Request, res: Response) => {
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, parseInt(req.params.id)));
    if (assignment) {
        res.json(assignment);
    } else {
        res.status(404).json({ error: "Assignment not found" });
    }
});

router.post("/assignments", async (req: Request, res: Response) => {
    const { schoolId, studentId, title, scheduledDate, exercises } = req.body;

    const [newAssignment] = await db.insert(assignments).values({
        schoolId,
        studentId,
        title,
        scheduledDate,
        exercises: exercises || [],
        status: "pending"
    }).returning();

    res.json(newAssignment);
});

router.put("/assignments/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { title, scheduledDate, exercises, status } = req.body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (scheduledDate !== undefined) updateData.scheduledDate = scheduledDate;
    if (exercises !== undefined) updateData.exercises = exercises;
    if (status !== undefined) updateData.status = status;

    const [updated] = await db.update(assignments).set(updateData).where(eq(assignments.id, id)).returning();
    if (updated) {
        res.json(updated);
    } else {
        res.status(404).json({ error: "Assignment not found" });
    }
});

router.delete("/assignments/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    await db.delete(assignments).where(eq(assignments.id, id));
    res.json({ success: true });
});

// ==================== EXERCISE RESULTS ====================
router.get("/assignments/:assignmentId/results", async (req: Request, res: Response) => {
    const assignmentId = parseInt(req.params.assignmentId);
    const results = await db.select().from(exerciseResults).where(eq(exerciseResults.assignmentId, assignmentId));
    res.json(results);
});

router.post("/assignments/:assignmentId/results", async (req: Request, res: Response) => {
    const assignmentId = parseInt(req.params.assignmentId);
    const { exerciseIndex, studentId, result, passed } = req.body;

    const [newResult] = await db.insert(exerciseResults).values({
        assignmentId,
        exerciseIndex,
        studentId,
        result: result || {},
        passed: passed ? 1 : 0
    }).returning();

    // Update assignment status
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, assignmentId));
    if (assignment) {
        const assignmentResults = await db.select().from(exerciseResults).where(eq(exerciseResults.assignmentId, assignmentId));
        const passedExerciseIndices = new Set(
            assignmentResults.filter(r => r.passed === 1).map(r => r.exerciseIndex)
        );
        const exercisesArray = assignment.exercises as Array<unknown>;

        let newStatus = assignment.status;
        if (passedExerciseIndices.size >= exercisesArray.length) {
            newStatus = "completed";
        } else if (assignmentResults.length > 0) {
            newStatus = "in_progress";
        }

        if (newStatus !== assignment.status) {
            await db.update(assignments).set({ status: newStatus }).where(eq(assignments.id, assignmentId));
        }
    }

    res.json(newResult);
});

// ==================== STUDENT PROGRESS ====================
router.get("/students/:studentId/progress", async (req: Request, res: Response) => {
    const studentId = parseInt(req.params.studentId);
    const studentAssignments = await db.select().from(assignments).where(eq(assignments.studentId, studentId));
    const results = await db.select().from(exerciseResults).where(eq(exerciseResults.studentId, studentId));

    const progress = studentAssignments.map(a => {
        const exercisesArray = a.exercises as Array<unknown>;
        return {
            assignment: a,
            completedExercises: results.filter(r => r.assignmentId === a.id).length,
            totalExercises: exercisesArray.length,
            passedExercises: results.filter(r => r.assignmentId === a.id && r.passed === 1).length
        };
    });

    res.json(progress);
});

// ==================== TEMPLATES ====================
router.get("/templates", async (req: Request, res: Response) => {
    const { schoolId } = req.query;
    let result;
    if (schoolId) {
        result = await db.select().from(templates).where(eq(templates.schoolId, parseInt(schoolId as string)));
    } else {
        result = await db.select().from(templates);
    }
    res.json(result);
});

router.get("/templates/:id", async (req: Request, res: Response) => {
    const [template] = await db.select().from(templates).where(eq(templates.id, parseInt(req.params.id)));
    if (template) {
        res.json(template);
    } else {
        res.status(404).json({ error: "Template not found" });
    }
});

router.post("/templates", async (req: Request, res: Response) => {
    const { schoolId, name, exercises } = req.body;
    const [newTemplate] = await db.insert(templates).values({
        schoolId,
        name,
        exercises
    }).returning();
    res.status(201).json(newTemplate);
});

router.put("/templates/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { name, exercises } = req.body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (exercises !== undefined) updateData.exercises = exercises;

    const [updated] = await db.update(templates).set(updateData).where(eq(templates.id, id)).returning();
    if (updated) {
        res.json(updated);
    } else {
        res.status(404).json({ error: "Template not found" });
    }
});

router.delete("/templates/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    await db.delete(templates).where(eq(templates.id, id));
    res.json({ success: true });
});

// ==================== COURSE TEMPLATES ====================
router.get("/courses", async (req: Request, res: Response) => {
    const { schoolId } = req.query;
    let result;
    if (schoolId) {
        result = await db.select().from(courseTemplates).where(eq(courseTemplates.schoolId, parseInt(schoolId as string)));
    } else {
        result = await db.select().from(courseTemplates);
    }
    res.json(result);
});

router.get("/courses/:id", async (req: Request, res: Response) => {
    const [course] = await db.select().from(courseTemplates).where(eq(courseTemplates.id, parseInt(req.params.id)));
    if (course) {
        res.json(course);
    } else {
        res.status(404).json({ error: "Course not found" });
    }
});

router.post("/courses", async (req: Request, res: Response) => {
    const { schoolId, name, days } = req.body;
    const [newCourse] = await db.insert(courseTemplates).values({
        schoolId,
        name,
        days: days || []
    }).returning();
    res.status(201).json(newCourse);
});

router.put("/courses/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { name, days } = req.body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (days !== undefined) updateData.days = days;

    const [updated] = await db.update(courseTemplates).set(updateData).where(eq(courseTemplates.id, id)).returning();
    if (updated) {
        res.json(updated);
    } else {
        res.status(404).json({ error: "Course not found" });
    }
});

router.delete("/courses/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    await db.delete(courseTemplates).where(eq(courseTemplates.id, id));
    res.json({ success: true });
});

// ==================== APPLY COURSE TO STUDENTS ====================
router.post("/courses/:id/apply", async (req: Request, res: Response) => {
    const courseId = parseInt(req.params.id);
    const { studentIds, startDate } = req.body;

    const [course] = await db.select().from(courseTemplates).where(eq(courseTemplates.id, courseId));
    if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
    }

    const days = course.days as Array<{ daysOffset: number; exercises: unknown[] }>;
    const baseDate = new Date(startDate);
    const createdAssignments: Assignment[] = [];

    for (const studentId of studentIds) {
        for (const day of days) {
            const assignmentDate = new Date(baseDate);
            assignmentDate.setDate(baseDate.getDate() + (day.daysOffset || 0));

            const [newAssignment] = await db.insert(assignments).values({
                schoolId: course.schoolId,
                studentId,
                title: assignmentDate.toLocaleDateString('ru-RU'),
                scheduledDate: assignmentDate.toISOString().split('T')[0],
                exercises: day.exercises || [],
                status: "pending"
            }).returning();

            createdAssignments.push(newAssignment);
        }
    }

    res.json({ success: true, createdAssignments: createdAssignments.length });
});

export default router;

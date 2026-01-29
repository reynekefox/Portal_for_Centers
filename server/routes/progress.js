import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get lessons assigned to a student (via query param)
router.get('/', async (req, res) => {
    try {
        const { student_id } = req.query;
        if (!student_id) {
            return res.status(400).json({ error: 'student_id is required' });
        }
        const today = new Date().toISOString().split('T')[0];

        const result = await pool.query(
            `SELECT l.*, la.id as assignment_id, la.assigned_at,
                    COUNT(le.id) as total_exercises,
                    COUNT(lp.id) FILTER (WHERE lp.status = 'completed') as completed_exercises
             FROM lesson_assignments la
             JOIN lessons l ON l.id = la.lesson_id
             LEFT JOIN lesson_exercises le ON le.lesson_id = l.id
             LEFT JOIN lesson_progress lp ON lp.assignment_id = la.id AND lp.exercise_id = le.id
             WHERE la.student_id = $1 
               AND (l.scheduled_date IS NULL OR l.scheduled_date <= $2)
             GROUP BY l.id, la.id
             ORDER BY l.scheduled_date DESC NULLS LAST, la.assigned_at DESC`,
            [student_id, today]
        );

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get lessons assigned to a student (for today or available)
router.get('/student/:studentId/lessons', async (req, res) => {
    try {
        const { studentId } = req.params;
        const today = new Date().toISOString().split('T')[0];

        const result = await pool.query(
            `SELECT l.*, la.id as assignment_id, la.assigned_at,
                    COUNT(le.id) as total_exercises,
                    COUNT(lp.id) FILTER (WHERE lp.status = 'completed') as completed_exercises
             FROM lesson_assignments la
             JOIN lessons l ON l.id = la.lesson_id
             LEFT JOIN lesson_exercises le ON le.lesson_id = l.id
             LEFT JOIN lesson_progress lp ON lp.assignment_id = la.id AND lp.exercise_id = le.id
             WHERE la.student_id = $1 
               AND (l.scheduled_date IS NULL OR l.scheduled_date <= $2)
             GROUP BY l.id, la.id
             ORDER BY l.scheduled_date DESC NULLS LAST, la.assigned_at DESC`,
            [studentId, today]
        );

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get detailed progress for a specific lesson assignment
router.get('/student/:studentId/lessons/:lessonId', async (req, res) => {
    try {
        const { studentId, lessonId } = req.params;

        // Get assignment
        const assignmentResult = await pool.query(
            `SELECT la.*, l.title, l.description
             FROM lesson_assignments la
             JOIN lessons l ON l.id = la.lesson_id
             WHERE la.student_id = $1 AND la.lesson_id = $2`,
            [studentId, lessonId]
        );

        if (assignmentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        const assignment = assignmentResult.rows[0];

        // Get exercises with progress
        const exercisesResult = await pool.query(
            `SELECT le.*, 
                    COALESCE(lp.status, 'pending') as status,
                    lp.started_at, lp.completed_at, lp.result
             FROM lesson_exercises le
             LEFT JOIN lesson_progress lp ON lp.exercise_id = le.id AND lp.assignment_id = $1
             WHERE le.lesson_id = $2
             ORDER BY le.order_index`,
            [assignment.id, lessonId]
        );

        res.json({
            ...assignment,
            exercises: exercisesResult.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start an exercise
router.post('/start', async (req, res) => {
    try {
        const { assignment_id, exercise_id } = req.body;

        // Check if progress record exists, create if not
        const existingResult = await pool.query(
            'SELECT * FROM lesson_progress WHERE assignment_id = $1 AND exercise_id = $2',
            [assignment_id, exercise_id]
        );

        if (existingResult.rows.length === 0) {
            await pool.query(
                `INSERT INTO lesson_progress (assignment_id, exercise_id, status, started_at)
                 VALUES ($1, $2, 'in_progress', NOW())`,
                [assignment_id, exercise_id]
            );
        } else {
            await pool.query(
                `UPDATE lesson_progress 
                 SET status = 'in_progress', started_at = COALESCE(started_at, NOW())
                 WHERE assignment_id = $1 AND exercise_id = $2`,
                [assignment_id, exercise_id]
            );
        }

        const result = await pool.query(
            'SELECT * FROM lesson_progress WHERE assignment_id = $1 AND exercise_id = $2',
            [assignment_id, exercise_id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Complete an exercise
router.post('/complete', async (req, res) => {
    try {
        const { assignment_id, exercise_id, result: exerciseResult } = req.body;

        const updateResult = await pool.query(
            `UPDATE lesson_progress 
             SET status = 'completed', completed_at = NOW(), result = $3
             WHERE assignment_id = $1 AND exercise_id = $2
             RETURNING *`,
            [assignment_id, exercise_id, exerciseResult || {}]
        );

        if (updateResult.rows.length === 0) {
            // Create if doesn't exist
            const insertResult = await pool.query(
                `INSERT INTO lesson_progress (assignment_id, exercise_id, status, started_at, completed_at, result)
                 VALUES ($1, $2, 'completed', NOW(), NOW(), $3)
                 RETURNING *`,
                [assignment_id, exercise_id, exerciseResult || {}]
            );
            return res.json(insertResult.rows[0]);
        }

        res.json(updateResult.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get current exercise config (for ScreenCreator integration)
router.get('/exercise/:exerciseId/config', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT le.*, l.title as lesson_title
             FROM lesson_exercises le
             JOIN lessons l ON l.id = le.lesson_id
             WHERE le.id = $1`,
            [req.params.exerciseId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Exercise not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

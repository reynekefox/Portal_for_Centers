import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all lessons for a school
router.get('/', async (req, res) => {
    try {
        const { school_id } = req.query;
        if (!school_id) {
            return res.status(400).json({ error: 'school_id is required' });
        }

        const result = await pool.query(
            `SELECT l.*, 
                    COUNT(DISTINCT le.id) as exercise_count,
                    COUNT(DISTINCT la.student_id) as assigned_count
             FROM lessons l
             LEFT JOIN lesson_exercises le ON le.lesson_id = l.id
             LEFT JOIN lesson_assignments la ON la.lesson_id = l.id
             WHERE l.school_id = $1
             GROUP BY l.id
             ORDER BY l.created_at DESC`,
            [school_id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single lesson with exercises
router.get('/:id', async (req, res) => {
    try {
        const lessonResult = await pool.query(
            'SELECT * FROM lessons WHERE id = $1',
            [req.params.id]
        );

        if (lessonResult.rows.length === 0) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        const exercisesResult = await pool.query(
            'SELECT * FROM lesson_exercises WHERE lesson_id = $1 ORDER BY order_index',
            [req.params.id]
        );

        const assignmentsResult = await pool.query(
            `SELECT la.*, s.first_name, s.last_name
             FROM lesson_assignments la
             JOIN students s ON s.id = la.student_id
             WHERE la.lesson_id = $1`,
            [req.params.id]
        );

        res.json({
            ...lessonResult.rows[0],
            exercises: exercisesResult.rows,
            assignments: assignmentsResult.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create lesson
router.post('/', async (req, res) => {
    try {
        const { school_id, title, description, scheduled_date } = req.body;
        const result = await pool.query(
            `INSERT INTO lessons (school_id, title, description, scheduled_date)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [school_id, title, description, scheduled_date || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update lesson
router.put('/:id', async (req, res) => {
    try {
        const { title, description, scheduled_date } = req.body;
        const result = await pool.query(
            `UPDATE lessons 
             SET title = $1, description = $2, scheduled_date = $3
             WHERE id = $4
             RETURNING *`,
            [title, description, scheduled_date || null, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lesson not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete lesson
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM lessons WHERE id = $1 RETURNING *',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lesson not found' });
        }
        res.json({ message: 'Lesson deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== EXERCISES =====

// Add exercise to lesson
router.post('/:id/exercises', async (req, res) => {
    try {
        const { game_id, order_index, duration_seconds, rounds_count, settings } = req.body;
        const result = await pool.query(
            `INSERT INTO lesson_exercises (lesson_id, game_id, order_index, duration_seconds, rounds_count, settings)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [req.params.id, game_id, order_index, duration_seconds || null, rounds_count || null, settings || {}]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update exercise
router.put('/:id/exercises/:exId', async (req, res) => {
    try {
        const { game_id, order_index, duration_seconds, rounds_count, settings } = req.body;
        const result = await pool.query(
            `UPDATE lesson_exercises 
             SET game_id = $1, order_index = $2, duration_seconds = $3, rounds_count = $4, settings = $5
             WHERE id = $6 AND lesson_id = $7
             RETURNING *`,
            [game_id, order_index, duration_seconds || null, rounds_count || null, settings || {}, req.params.exId, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Exercise not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete exercise
router.delete('/:id/exercises/:exId', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM lesson_exercises WHERE id = $1 AND lesson_id = $2 RETURNING *',
            [req.params.exId, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Exercise not found' });
        }
        res.json({ message: 'Exercise deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== ASSIGNMENTS =====

// Assign lesson to students
router.post('/:id/assign', async (req, res) => {
    try {
        const { student_ids } = req.body;
        if (!Array.isArray(student_ids) || student_ids.length === 0) {
            return res.status(400).json({ error: 'student_ids array is required' });
        }

        const values = student_ids.map((sid, i) => `($1, $${i + 2})`).join(', ');
        const result = await pool.query(
            `INSERT INTO lesson_assignments (lesson_id, student_id)
             VALUES ${values}
             ON CONFLICT (lesson_id, student_id) DO NOTHING
             RETURNING *`,
            [req.params.id, ...student_ids]
        );

        // Initialize progress records for each exercise
        const exercises = await pool.query(
            'SELECT id FROM lesson_exercises WHERE lesson_id = $1',
            [req.params.id]
        );

        for (const assignment of result.rows) {
            for (const exercise of exercises.rows) {
                await pool.query(
                    `INSERT INTO lesson_progress (assignment_id, exercise_id, status)
                     VALUES ($1, $2, 'pending')
                     ON CONFLICT (assignment_id, exercise_id) DO NOTHING`,
                    [assignment.id, exercise.id]
                );
            }
        }

        res.status(201).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Remove assignment
router.delete('/:id/assign/:studentId', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM lesson_assignments WHERE lesson_id = $1 AND student_id = $2 RETURNING *',
            [req.params.id, req.params.studentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        res.json({ message: 'Assignment removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

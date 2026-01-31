import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET /api/courses - get all course templates for a school
router.get('/', async (req, res) => {
    try {
        const { schoolId } = req.query;
        if (!schoolId) {
            return res.status(400).json({ message: 'schoolId is required' });
        }

        const result = await pool.query(
            `SELECT * FROM course_templates WHERE school_id = $1 ORDER BY created_at DESC`,
            [schoolId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching course templates:', error);
        res.status(500).json({ message: 'Error fetching course templates' });
    }
});

// POST /api/courses - create a new course template
router.post('/', async (req, res) => {
    try {
        const { schoolId, name, days } = req.body;
        if (!schoolId || !name) {
            return res.status(400).json({ message: 'schoolId and name are required' });
        }

        const result = await pool.query(
            `INSERT INTO course_templates (school_id, name, days) VALUES ($1, $2, $3) RETURNING *`,
            [schoolId, name, JSON.stringify(days || [])]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating course template:', error);
        res.status(500).json({ message: 'Error creating course template' });
    }
});

// PUT /api/courses/:id - update a course template
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, days } = req.body;

        const result = await pool.query(
            `UPDATE course_templates SET name = $1, days = $2 WHERE id = $3 RETURNING *`,
            [name, JSON.stringify(days || []), id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Course template not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating course template:', error);
        res.status(500).json({ message: 'Error updating course template' });
    }
});

// DELETE /api/courses/:id - delete a course template
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM course_templates WHERE id = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Course template not found' });
        }

        res.json({ message: 'Course template deleted' });
    } catch (error) {
        console.error('Error deleting course template:', error);
        res.status(500).json({ message: 'Error deleting course template' });
    }
});

export default router;

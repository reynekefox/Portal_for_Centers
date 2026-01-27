import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all schools
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM schools ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get school by ID
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM schools WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'School not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create school
router.post('/', async (req, res) => {
    try {
        const { title, login, password } = req.body;
        const result = await pool.query(
            'INSERT INTO schools (title, login, password) VALUES ($1, $2, $3) RETURNING *',
            [title, login, password]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update school
router.put('/:id', async (req, res) => {
    try {
        const { title, login, password } = req.body;
        const result = await pool.query(
            'UPDATE schools SET title = $1, login = $2, password = $3 WHERE id = $4 RETURNING *',
            [title, login, password, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'School not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete school
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM schools WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'School not found' });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get students for a school
router.get('/:id/students', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM students WHERE school_id = $1 ORDER BY created_at DESC',
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

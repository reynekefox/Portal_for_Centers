import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all students
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM students ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get student by ID
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM students WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create student
router.post('/', async (req, res) => {
    try {
        const { school_id, first_name, last_name, login, password, allowed_games } = req.body;
        const games = allowed_games || [];
        const result = await pool.query(
            'INSERT INTO students (school_id, first_name, last_name, login, password, allowed_games) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [school_id, first_name, last_name, login, password, JSON.stringify(games)]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update student
router.put('/:id', async (req, res) => {
    try {
        const { first_name, last_name, login, password, allowed_games } = req.body;
        const games = allowed_games || [];
        const result = await pool.query(
            'UPDATE students SET first_name = $1, last_name = $2, login = $3, password = $4, allowed_games = $5 WHERE id = $6 RETURNING *',
            [first_name, last_name, login, password, JSON.stringify(games), req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete student
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM students WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

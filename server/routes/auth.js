import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Admin login (hardcoded)
router.post('/admin', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin') {
        res.json({ success: true, role: 'admin' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// School login
router.post('/school', async (req, res) => {
    try {
        const { login, password } = req.body;
        const result = await pool.query(
            'SELECT id, title, login FROM schools WHERE login = $1 AND password = $2',
            [login, password]
        );

        if (result.rows.length > 0) {
            res.json({ success: true, role: 'school', school: result.rows[0] });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Student login
router.post('/student', async (req, res) => {
    try {
        const { login, password } = req.body;
        const result = await pool.query(
            'SELECT id, school_id, first_name, last_name, login, allowed_games FROM students WHERE login = $1 AND password = $2',
            [login, password]
        );

        if (result.rows.length > 0) {
            res.json({ success: true, role: 'student', student: result.rows[0] });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;

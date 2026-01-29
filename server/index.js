import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

import pool from './db.js';
import authRoutes from './routes/auth.js';
import schoolsRoutes from './routes/schools.js';
import studentsRoutes from './routes/students.js';
import lessonsRoutes from './routes/lessons.js';
import progressRoutes from './routes/progress.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/schools', schoolsRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/progress', progressRoutes);

// Serve static frontend (production)
app.use(express.static(path.join(__dirname, '../dist')));

// SPA fallback - only for non-API routes
app.get('/{*splat}', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
    }
    const indexPath = path.join(__dirname, '../dist/index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            // In dev mode, dist might not exist
            res.status(200).send('Portal running in dev mode. Use npm run dev for frontend.');
        }
    });
});

// Initialize database tables
async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS schools (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                login VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS students (
                id SERIAL PRIMARY KEY,
                school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                login VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                allowed_games JSONB DEFAULT '[]',
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Add allowed_games column if it doesn't exist (for existing tables)
        await pool.query(`
            ALTER TABLE students 
            ADD COLUMN IF NOT EXISTS allowed_games JSONB DEFAULT '[]'
        `);

        // Lessons table - stores lesson definitions
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lessons (
                id SERIAL PRIMARY KEY,
                school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                scheduled_date DATE,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Lesson exercises - stores exercises within a lesson
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lesson_exercises (
                id SERIAL PRIMARY KEY,
                lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
                game_id VARCHAR(50) NOT NULL,
                order_index INTEGER NOT NULL,
                duration_seconds INTEGER,
                rounds_count INTEGER,
                settings JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Lesson assignments - assigns lessons to students
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lesson_assignments (
                id SERIAL PRIMARY KEY,
                lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
                student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
                assigned_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(lesson_id, student_id)
            )
        `);

        // Lesson progress - tracks student progress through exercises
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lesson_progress (
                id SERIAL PRIMARY KEY,
                assignment_id INTEGER REFERENCES lesson_assignments(id) ON DELETE CASCADE,
                exercise_id INTEGER REFERENCES lesson_exercises(id) ON DELETE CASCADE,
                status VARCHAR(20) DEFAULT 'pending',
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                result JSONB,
                UNIQUE(assignment_id, exercise_id)
            )
        `);

        console.log('✅ Database tables initialized');
    } catch (err) {
        console.error('❌ Failed to initialize database:', err.message);
    }
}

initDB();

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

import { Store } from './store.js';
import { HomeView } from './views/HomeView.js';
import { LoginView } from './views/LoginView.js';
import { AdminView } from './views/AdminView.js';
import { SchoolLoginView } from './views/SchoolLoginView.js';
import { SchoolDashboardView } from './views/SchoolDashboardView.js';
import { StudentGamesView } from './views/StudentGamesView.js';
import { LessonsManageView } from './views/LessonsManageView.js';
import { LessonEditorView } from './views/LessonEditorView.js';
import { StudentLessonView } from './views/StudentLessonView.js';

const routes = {
    '': HomeView,
    'login': LoginView,
    'admin': AdminView,
    'school-login': SchoolLoginView,
    'school-dashboard': SchoolDashboardView,
    'school': SchoolDashboardView, // alias
    'student-games': StudentGamesView,
    'games': StudentGamesView, // alias
    'school-dashboard/lessons': LessonsManageView,
    // Dynamic routes handled separately
};

// Pattern routes for dynamic IDs
const patternRoutes = [
    { pattern: /^school-dashboard\/lessons\/(\d+)$/, view: LessonEditorView },
    { pattern: /^student-lesson\/(\d+)$/, view: StudentLessonView },
];

export const Router = {
    init() {
        window.addEventListener('hashchange', this.handleRoute.bind(this));
        this.handleRoute(); // Handle initial load
    },

    handleRoute() {
        // Strip #, then optional /
        const hash = window.location.hash.slice(1).replace(/^\//, '') || '';
        const app = document.getElementById('router-view');

        // Admin Auth Guard
        if (hash === 'admin' && !Store.isAdmin()) {
            window.location.hash = '/login';
            return;
        }

        // School Auth Guard
        if ((hash === 'school' || hash === 'school-dashboard' || hash.startsWith('school-dashboard/')) && !Store.isSchool()) {
            window.location.hash = '/school-login';
            return;
        }

        // Student Auth Guard for games and lessons
        if ((hash === 'games' || hash === 'student-games' || hash.startsWith('student-lesson/')) && !Store.isStudent()) {
            window.location.hash = '/school-login';
            return;
        }

        // Check static routes first
        let ViewComponent = routes[hash];

        // If not found, check pattern routes
        if (!ViewComponent) {
            for (const route of patternRoutes) {
                if (route.pattern.test(hash)) {
                    ViewComponent = route.view;
                    break;
                }
            }
        }

        // Fallback to home
        if (!ViewComponent) {
            ViewComponent = HomeView;
        }

        // Clear current view
        app.innerHTML = '';
        // Render new view
        app.appendChild(ViewComponent.render());

        // View mounted hook (if needed)
        if (ViewComponent.mounted) {
            ViewComponent.mounted();
        }
    }
};

import { Store } from './store.js';
import { HomeView } from './views/HomeView.js';
import { LoginView } from './views/LoginView.js';
import { AdminView } from './views/AdminView.js';
import { SchoolLoginView } from './views/SchoolLoginView.js';
import { SchoolDashboardView } from './views/SchoolDashboardView.js';
import { StudentGamesView } from './views/StudentGamesView.js';

const routes = {
    '': HomeView,
    'login': LoginView,
    'admin': AdminView,
    'school-login': SchoolLoginView,
    'school': SchoolDashboardView,
    'games': StudentGamesView,
};

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
        if (hash === 'school' && !Store.isSchool()) {
            window.location.hash = '/school-login';
            return;
        }

        // Student Auth Guard for games
        if (hash === 'games' && !Store.isStudent()) {
            window.location.hash = '/school-login';
            return;
        }

        const ViewComponent = routes[hash] || HomeView;

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



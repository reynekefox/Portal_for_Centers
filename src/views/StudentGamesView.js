import { Store } from '../store.js';

export const StudentGamesView = {
  render() {
    const student = Store.getCurrentStudent();
    if (!student) {
      window.location.hash = '/school-login';
      return document.createElement('div');
    }

    // Redirect to ScreenCreator games portal
    window.location.href = 'http://localhost:5000';

    const container = document.createElement('div');
    container.className = 'container';
    container.innerHTML = `
            <div class="text-center mt-xl">
                <h2>Перенаправление на портал игр...</h2>
                <p class="text-light mt-md">Если страница не открылась, <a href="http://localhost:5000" target="_blank">нажмите здесь</a></p>
            </div>
        `;
    return container;
  },

  mounted() {
    // Logout handler if they return to this page
    const logoutBtn = document.getElementById('student-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        Store.studentLogout();
      });
    }
  }
};

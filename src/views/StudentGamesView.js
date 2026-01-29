import { Store } from '../store.js';

// List of available games with their metadata
const AVAILABLE_GAMES = [
  { id: 'stroop-test', name: 'Тест Струпа', icon: '🎨', description: 'Тренировка внимания и когнитивной гибкости', color: 'indigo' },
  { id: 'schulte-table', name: 'Таблица Шульте', icon: '🔢', description: 'Развитие периферического зрения', color: 'primary' },
  { id: 'munsterberg-test', name: 'Тест Мюнстенберга', icon: '🔍', description: 'Избирательность внимания', color: 'primary' },
  { id: 'alphabet-game', name: 'Алфавит', icon: '🔤', description: 'Скоростной поиск букв', color: 'indigo' },
  { id: 'n-back', name: 'N-back', icon: '🧠', description: 'Тренировка рабочей памяти', color: 'primary' },
  { id: 'correction-test', name: 'Корректурная проба', icon: '✏️', description: 'Устойчивость внимания', color: 'indigo' },
  { id: 'calcudoku', name: 'Калькудоку', icon: '🧮', description: 'Математические головоломки', color: 'primary' },
  { id: 'counting-game', name: 'Считалка', icon: '📊', description: 'Быстрый устный счет', color: 'indigo' },
  { id: 'magic-forest', name: 'Волшебный лес', icon: '🌲', description: 'Тренировка зрительной памяти', color: 'green' },
  { id: 'speed-reading', name: 'Турбочтение', icon: '📖', description: 'Увеличение скорости чтения', color: 'purple' }
];

const SCREENCREATOR_URL = 'http://localhost:5001';

export const StudentGamesView = {
  render() {
    const student = Store.getCurrentStudent();
    if (!student) {
      window.location.hash = '/school-login';
      return document.createElement('div');
    }

    const allowedGames = student.allowed_games || [];
    const filteredGames = AVAILABLE_GAMES.filter(game => allowedGames.includes(game.id));

    const container = document.createElement('div');
    container.className = 'container games-portal';

    container.innerHTML = `
      <header class="admin-header">
        <h1>Привет, ${student.first_name}! 👋</h1>
        <button id="student-logout-btn" class="btn btn-outline">Выйти</button>
      </header>
      
      <!-- Lessons Banner -->
      <div id="lessons-banner" class="lessons-banner hidden"></div>
      
      <div class="games-intro mt-lg text-center">
        <p class="text-lg">Выбери игру для тренировки!</p>
      </div>
      
      ${filteredGames.length === 0 ? `
        <div class="text-center mt-xl">
          <h2>Нет доступных игр</h2>
          <p class="text-light mt-md">Обратитесь к администратору школы для получения доступа к играм.</p>
        </div>
      ` : `
        <div class="games-grid mt-xl">
          ${filteredGames.map(game => `
            <div class="game-card card">
              <div class="game-icon">${game.icon}</div>
              <h3>${game.name}</h3>
              <p class="text-sm text-light">${game.description}</p>
              <a href="${SCREENCREATOR_URL}/${game.id}" target="_blank" class="btn btn-primary mt-md">Играть</a>
            </div>
          `).join('')}
        </div>
      `}
    `;

    return container;
  },

  async mounted() {
    const student = Store.getCurrentStudent();

    const logoutBtn = document.getElementById('student-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        Store.studentLogout();
      });
    }

    // Load assigned lessons
    await this.loadLessons(student.id);
  },

  async loadLessons(studentId) {
    const banner = document.getElementById('lessons-banner');
    const lessons = await Store.getStudentLessons(studentId);

    if (!lessons || lessons.length === 0) {
      banner.classList.add('hidden');
      return;
    }

    // Filter to show only incomplete lessons
    const incompleteLessons = lessons.filter(l =>
      parseInt(l.completed_exercises) < parseInt(l.total_exercises)
    );

    if (incompleteLessons.length === 0) {
      banner.classList.add('hidden');
      return;
    }

    banner.classList.remove('hidden');
    banner.innerHTML = `
      <div class="lessons-banner-content">
        <div class="banner-icon">📚</div>
        <div class="banner-text">
          <h3>У вас есть занятия!</h3>
          <p class="text-sm">Выполните назначенные тренировки</p>
        </div>
      </div>
      <div class="lessons-list">
        ${incompleteLessons.map(lesson => {
      const completed = parseInt(lesson.completed_exercises);
      const total = parseInt(lesson.total_exercises);
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      const dateStr = lesson.scheduled_date
        ? new Date(lesson.scheduled_date).toLocaleDateString('ru-RU')
        : '';

      return `
            <div class="lesson-banner-item card">
              <div class="lesson-info">
                <strong>${lesson.title}</strong>
                <div class="lesson-progress-bar">
                  <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <span class="text-xs text-light">${completed}/${total} упражнений ${dateStr ? `• ${dateStr}` : ''}</span>
              </div>
              <a href="#/student-lesson/${lesson.id}" class="btn btn-primary btn-sm">
                ${completed > 0 ? 'Продолжить' : 'Начать'}
              </a>
            </div>
          `;
    }).join('')}
      </div>
    `;
  }
};


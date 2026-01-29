import { Store } from '../store.js';
import { AVAILABLE_GAMES } from './LessonsManageView.js';

const SCREENCREATOR_URL = 'http://localhost:5001';

export const StudentLessonView = {
  render() {
    const student = Store.getCurrentStudent();
    if (!student) {
      window.location.hash = '/school-login';
      return document.createElement('div');
    }

    const container = document.createElement('div');
    container.className = 'container student-lesson';

    container.innerHTML = `
      <header class="admin-header">
        <div class="header-left">
          <a href="#/student-games" class="btn btn-link">← Назад</a>
          <h1 id="lesson-title">Загрузка занятия...</h1>
        </div>
      </header>
      
      <div id="lesson-content" class="lesson-content mt-lg">
        <p class="text-light">Загрузка...</p>
      </div>
    `;

    return container;
  },

  async mounted() {
    const student = Store.getCurrentStudent();
    const lessonId = this.getLessonIdFromHash();

    if (!lessonId) {
      window.location.hash = '/student-games';
      return;
    }

    this.studentId = student.id;
    this.lessonId = lessonId;

    await this.loadProgress();
  },

  getLessonIdFromHash() {
    const match = window.location.hash.match(/\/student-lesson\/(\d+)/);
    return match ? match[1] : null;
  },

  async loadProgress() {
    const progress = await Store.getStudentLessonProgress(this.studentId, this.lessonId);

    if (!progress || progress.error) {
      document.getElementById('lesson-content').innerHTML = `
        <div class="card text-center">
          <h3>Занятие не найдено</h3>
          <p class="text-light">Это занятие не назначено вам или было удалено.</p>
          <a href="#/student-games" class="btn btn-primary mt-md">Вернуться</a>
        </div>
      `;
      return;
    }

    this.progress = progress;
    this.assignmentId = progress.id;
    this.exercises = progress.exercises || [];

    document.getElementById('lesson-title').textContent = progress.title;
    this.renderProgress();
  },

  renderProgress() {
    const content = document.getElementById('lesson-content');
    const exercises = this.exercises;

    const completed = exercises.filter(e => e.status === 'completed').length;
    const total = exercises.length;
    const allCompleted = completed === total;

    // Find current exercise (first non-completed)
    const currentExercise = exercises.find(e => e.status !== 'completed');

    content.innerHTML = `
      <div class="progress-header card">
        <div class="progress-stats">
          <div class="progress-bar-wrapper">
            <div class="progress-bar" style="width: ${total > 0 ? (completed / total) * 100 : 0}%"></div>
          </div>
          <span class="progress-text">${completed} из ${total} выполнено</span>
        </div>
        ${allCompleted ? `
          <div class="completion-badge">
            <span class="badge badge-success">✓ Занятие завершено!</span>
          </div>
        ` : ''}
      </div>
      
      <div class="exercises-timeline mt-lg">
        ${exercises.map((ex, index) => {
      const game = AVAILABLE_GAMES.find(g => g.id === ex.game_id);
      const gameName = game ? game.name : ex.game_id;
      const gameIcon = game ? game.icon : '🎮';

      let statusClass = '';
      let statusIcon = '';
      let actionBtn = '';

      if (ex.status === 'completed') {
        statusClass = 'completed';
        statusIcon = '✓';
      } else if (ex.status === 'in_progress') {
        statusClass = 'in-progress';
        statusIcon = '▶';
        actionBtn = `<button class="btn btn-primary start-exercise-btn" data-id="${ex.id}">Продолжить</button>`;
      } else if (currentExercise && currentExercise.id === ex.id) {
        statusClass = 'current';
        statusIcon = '▶';
        actionBtn = `<button class="btn btn-primary start-exercise-btn" data-id="${ex.id}">Начать</button>`;
      } else {
        statusClass = 'pending';
        statusIcon = '○';
      }

      const durationStr = ex.duration_seconds ? `⏱ ${ex.duration_seconds} сек` : '';

      return `
            <div class="exercise-timeline-item ${statusClass}">
              <div class="timeline-marker">${statusIcon}</div>
              <div class="timeline-content card">
                <div class="timeline-header">
                  <span class="exercise-number">${index + 1}</span>
                  <span class="exercise-icon">${gameIcon}</span>
                  <strong>${gameName}</strong>
                  ${durationStr ? `<span class="text-sm text-light">${durationStr}</span>` : ''}
                </div>
                ${actionBtn ? `<div class="timeline-action mt-sm">${actionBtn}</div>` : ''}
                ${ex.status === 'completed' && ex.completed_at ? `
                  <div class="text-xs text-light mt-sm">
                    Завершено: ${new Date(ex.completed_at).toLocaleString('ru-RU')}
                  </div>
                ` : ''}
              </div>
            </div>
          `;
    }).join('')}
      </div>
    `;

    // Event listeners for start buttons
    content.querySelectorAll('.start-exercise-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await this.startExercise(parseInt(btn.dataset.id));
      });
    });
  },

  async startExercise(exerciseId) {
    const exercise = this.exercises.find(e => e.id === exerciseId);
    if (!exercise) return;

    // Mark as started
    await Store.startExercise(this.assignmentId, exerciseId);

    // Build URL with config
    const config = {
      ...exercise.settings,
      duration: exercise.duration_seconds,
      lessonMode: true,
      assignmentId: this.assignmentId,
      exerciseId: exerciseId,
      callbackUrl: `${window.location.origin}/api/progress/complete`
    };

    const configBase64 = btoa(encodeURIComponent(JSON.stringify(config)));
    const gameUrl = `${SCREENCREATOR_URL}/${exercise.game_id}?config=${configBase64}`;

    // Open game in new window
    const gameWindow = window.open(gameUrl, '_blank');

    // Poll for window close and mark as complete
    const checkClosed = setInterval(async () => {
      if (gameWindow.closed) {
        clearInterval(checkClosed);
        // Mark as completed when user closes the game
        await Store.completeExercise(this.assignmentId, exerciseId, {
          completedAt: new Date().toISOString(),
          manualClose: true
        });
        await this.loadProgress();
      }
    }, 1000);
  }
};

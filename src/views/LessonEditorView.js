import { Store } from '../store.js';
import { AVAILABLE_GAMES } from './LessonsManageView.js';

export const LessonEditorView = {
    render() {
        const school = Store.getCurrentSchool();
        if (!school) {
            window.location.hash = '/school-login';
            return document.createElement('div');
        }

        const container = document.createElement('div');
        container.className = 'container lesson-editor';

        container.innerHTML = `
      <header class="admin-header">
        <div class="header-left">
          <a href="#/school-dashboard/lessons" class="btn btn-link">← К занятиям</a>
          <h1 id="lesson-title">Загрузка...</h1>
        </div>
        <button id="save-lesson-btn" class="btn btn-primary">Сохранить</button>
      </header>
      
      <div class="editor-grid mt-lg">
        <!-- Left: Lesson Info -->
        <div class="editor-sidebar">
          <div class="card">
            <h4>Информация</h4>
            <form id="lesson-info-form" class="mt-sm">
              <div class="form-group">
                <label>Название</label>
                <input type="text" name="title" class="form-input" required>
              </div>
              <div class="form-group">
                <label>Описание</label>
                <textarea name="description" class="form-input" rows="2"></textarea>
              </div>
              <div class="form-group">
                <label>Дата показа</label>
                <input type="date" name="scheduled_date" class="form-input">
              </div>
            </form>
          </div>
          
          <div class="card mt-md">
            <h4>Назначить ученикам</h4>
            <div id="students-checkboxes" class="mt-sm">
              <p class="text-light text-sm">Загрузка...</p>
            </div>
          </div>
        </div>
        
        <!-- Right: Exercises -->
        <div class="editor-main">
          <div class="card">
            <div class="card-header">
              <h4>Упражнения</h4>
              <button id="add-exercise-btn" class="btn btn-sm btn-primary">+ Добавить</button>
            </div>
            <div id="exercises-list" class="exercises-sortable mt-sm">
              <p class="text-light">Нет упражнений</p>
            </div>
          </div>
        </div>
      </div>
    `;

        return container;
    },

    async mounted() {
        const school = Store.getCurrentSchool();
        const lessonId = this.getLessonIdFromHash();

        if (!lessonId) {
            window.location.hash = '/school-dashboard/lessons';
            return;
        }

        this.lessonId = lessonId;
        this.schoolId = school.id;

        await this.loadLesson();
        await this.loadStudents();

        document.getElementById('add-exercise-btn').addEventListener('click', () => {
            this.showAddExerciseModal();
        });

        document.getElementById('save-lesson-btn').addEventListener('click', async () => {
            await this.saveLesson();
        });
    },

    getLessonIdFromHash() {
        const match = window.location.hash.match(/\/lessons\/(\d+)/);
        return match ? match[1] : null;
    },

    async loadLesson() {
        const lesson = await Store.getLesson(this.lessonId);
        if (!lesson) {
            alert('Занятие не найдено');
            window.location.hash = '/school-dashboard/lessons';
            return;
        }

        this.lesson = lesson;

        document.getElementById('lesson-title').textContent = lesson.title;

        const form = document.getElementById('lesson-info-form');
        form.querySelector('[name="title"]').value = lesson.title;
        form.querySelector('[name="description"]').value = lesson.description || '';
        form.querySelector('[name="scheduled_date"]').value = lesson.scheduled_date
            ? lesson.scheduled_date.split('T')[0]
            : '';

        this.renderExercises();
    },

    async loadStudents() {
        const students = await Store.getStudents(this.schoolId);
        const container = document.getElementById('students-checkboxes');

        if (students.length === 0) {
            container.innerHTML = '<p class="text-light text-sm">Нет учеников</p>';
            return;
        }

        const assignedIds = (this.lesson.assignments || []).map(a => a.student_id);

        container.innerHTML = students.map(s => `
      <label class="checkbox-item">
        <input type="checkbox" name="student" value="${s.id}" 
               ${assignedIds.includes(s.id) ? 'checked' : ''}>
        <span>${s.first_name} ${s.last_name}</span>
      </label>
    `).join('');
    },

    renderExercises() {
        const list = document.getElementById('exercises-list');
        const exercises = this.lesson.exercises || [];

        if (exercises.length === 0) {
            list.innerHTML = '<p class="text-light text-center">Добавьте упражнения с помощью кнопки выше</p>';
            return;
        }

        list.innerHTML = exercises.map((ex, index) => {
            const game = AVAILABLE_GAMES.find(g => g.id === ex.game_id);
            const gameName = game ? game.name : ex.game_id;
            const gameIcon = game ? game.icon : '🎮';

            const settingsStr = this.formatSettings(ex.settings);
            const durationStr = ex.duration_seconds ? `${ex.duration_seconds} сек` : 'Без ограничения';

            return `
        <div class="exercise-item" data-id="${ex.id}">
          <div class="exercise-number">${index + 1}</div>
          <div class="exercise-icon">${gameIcon}</div>
          <div class="exercise-info">
            <strong>${gameName}</strong>
            <span class="text-sm text-light">⏱ ${durationStr}</span>
            ${settingsStr ? `<span class="text-xs text-light">${settingsStr}</span>` : ''}
          </div>
          <div class="exercise-actions">
            <button class="btn-icon edit-exercise-btn" data-id="${ex.id}" title="Редактировать">✎</button>
            <button class="btn-icon delete-exercise-btn" data-id="${ex.id}" title="Удалить">✕</button>
          </div>
        </div>
      `;
        }).join('');

        // Event listeners
        list.querySelectorAll('.edit-exercise-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const ex = exercises.find(e => e.id == btn.dataset.id);
                if (ex) this.showEditExerciseModal(ex);
            });
        });

        list.querySelectorAll('.delete-exercise-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Удалить это упражнение?')) {
                    await Store.deleteExercise(this.lessonId, btn.dataset.id);
                    await this.loadLesson();
                }
            });
        });
    },

    formatSettings(settings) {
        if (!settings || Object.keys(settings).length === 0) return '';
        const parts = Object.entries(settings)
            .filter(([k, v]) => v !== null && v !== undefined && v !== '')
            .map(([k, v]) => `${k}: ${v}`)
            .slice(0, 3);
        return parts.join(', ');
    },

    showAddExerciseModal() {
        this.showExerciseModal(null);
    },

    showEditExerciseModal(exercise) {
        this.showExerciseModal(exercise);
    },

    showExerciseModal(exercise) {
        const existingModal = document.getElementById('exercise-modal');
        if (existingModal) existingModal.remove();

        const isEdit = !!exercise;
        const selectedGameId = exercise ? exercise.game_id : AVAILABLE_GAMES[0].id;
        const currentSettings = exercise ? (exercise.settings || {}) : {};

        const modal = document.createElement('div');
        modal.id = 'exercise-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
      <div class="modal-content card modal-lg">
        <h3>${isEdit ? 'Редактировать упражнение' : 'Добавить упражнение'}</h3>
        <form id="exercise-form" class="mt-md">
          <div class="form-grid">
            <div class="form-group">
              <label>Игра</label>
              <select name="game_id" class="form-input" id="game-select">
                ${AVAILABLE_GAMES.map(g => `
                  <option value="${g.id}" ${g.id === selectedGameId ? 'selected' : ''}>${g.icon} ${g.name}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Время (секунд)</label>
              <input type="number" name="duration_seconds" class="form-input" 
                     value="${exercise?.duration_seconds || ''}" 
                     placeholder="Без ограничения" min="10" step="10">
            </div>
          </div>
          
          <div id="game-settings" class="game-settings-grid mt-md">
            <!-- Dynamic settings will be rendered here -->
          </div>
          
          <div class="modal-actions mt-lg">
            <button type="button" id="cancel-exercise-btn" class="btn btn-outline">Отмена</button>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Сохранить' : 'Добавить'}</button>
          </div>
        </form>
      </div>
    `;
        document.body.appendChild(modal);

        const gameSelect = document.getElementById('game-select');
        const settingsContainer = document.getElementById('game-settings');

        const renderGameSettings = (gameId) => {
            const game = AVAILABLE_GAMES.find(g => g.id === gameId);
            if (!game || !game.settings) {
                settingsContainer.innerHTML = '<p class="text-light">Нет настроек для этой игры</p>';
                return;
            }

            settingsContainer.innerHTML = game.settings.map(setting => {
                const currentValue = currentSettings[setting.key] ?? setting.default;

                if (setting.type === 'checkbox') {
                    return `
            <label class="checkbox-item">
              <input type="checkbox" name="setting_${setting.key}" ${currentValue ? 'checked' : ''}>
              <span>${setting.label}</span>
            </label>
          `;
                }

                if (setting.type === 'select') {
                    return `
            <div class="form-group">
              <label>${setting.label}</label>
              <select name="setting_${setting.key}" class="form-input">
                ${setting.options.map(opt => `
                  <option value="${opt.value}" ${currentValue == opt.value ? 'selected' : ''}>${opt.label}</option>
                `).join('')}
              </select>
            </div>
          `;
                }

                if (setting.type === 'range') {
                    return `
            <div class="form-group">
              <label>${setting.label}: <span id="val_${setting.key}">${currentValue}</span></label>
              <input type="range" name="setting_${setting.key}" class="form-input"
                     min="${setting.min}" max="${setting.max}" step="${setting.step}" value="${currentValue}"
                     oninput="document.getElementById('val_${setting.key}').textContent = this.value">
            </div>
          `;
                }

                return '';
            }).join('');
        };

        renderGameSettings(selectedGameId);

        gameSelect.addEventListener('change', () => {
            renderGameSettings(gameSelect.value);
        });

        document.getElementById('cancel-exercise-btn').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

        document.getElementById('exercise-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);

            const gameId = formData.get('game_id');
            const game = AVAILABLE_GAMES.find(g => g.id === gameId);

            // Collect settings
            const settings = {};
            if (game && game.settings) {
                game.settings.forEach(s => {
                    const inputName = `setting_${s.key}`;
                    if (s.type === 'checkbox') {
                        settings[s.key] = formData.get(inputName) === 'on';
                    } else {
                        const val = formData.get(inputName);
                        settings[s.key] = s.type === 'range' ? parseFloat(val) : val;
                    }
                });
            }

            const exerciseData = {
                game_id: gameId,
                order_index: isEdit ? exercise.order_index : (this.lesson.exercises?.length || 0) + 1,
                duration_seconds: formData.get('duration_seconds') ? parseInt(formData.get('duration_seconds')) : null,
                settings
            };

            if (isEdit) {
                await Store.updateExercise(this.lessonId, exercise.id, exerciseData);
            } else {
                await Store.addExercise(this.lessonId, exerciseData);
            }

            modal.remove();
            await this.loadLesson();
        });
    },

    async saveLesson() {
        const form = document.getElementById('lesson-info-form');
        const formData = new FormData(form);

        // Update lesson info
        await Store.updateLesson(this.lessonId, {
            title: formData.get('title'),
            description: formData.get('description'),
            scheduled_date: formData.get('scheduled_date') || null
        });

        // Update assignments
        const checkedStudents = Array.from(document.querySelectorAll('input[name="student"]:checked'))
            .map(cb => parseInt(cb.value));

        const currentAssigned = (this.lesson.assignments || []).map(a => a.student_id);

        // Add new assignments
        const toAssign = checkedStudents.filter(id => !currentAssigned.includes(id));
        if (toAssign.length > 0) {
            await Store.assignLesson(this.lessonId, toAssign);
        }

        // Remove unchecked
        const toRemove = currentAssigned.filter(id => !checkedStudents.includes(id));
        for (const studentId of toRemove) {
            await Store.unassignLesson(this.lessonId, studentId);
        }

        // Refresh
        await this.loadLesson();
        await this.loadStudents();

        // Show success
        document.getElementById('lesson-title').textContent = formData.get('title') + ' ✓';
        setTimeout(() => {
            document.getElementById('lesson-title').textContent = formData.get('title');
        }, 2000);
    }
};

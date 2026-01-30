import { Store } from '../store.js';

// List of available games with settings schemas
export const AVAILABLE_GAMES = [
    {
        id: 'stroop-test',
        name: 'Тест Струпа',
        icon: '🎨',
        settings: [
            { key: 'speed', label: 'Скорость', type: 'range', min: 0.5, max: 3, step: 0.1, default: 1 },
            { key: 'fontSize', label: 'Размер шрифта', type: 'range', min: 3, max: 8, step: 1, default: 5 },
            { key: 'showClaps', label: 'Режим "Хлопки"', type: 'checkbox', default: false }
        ]
    },
    {
        id: 'schulte-table',
        name: 'Таблица Шульте',
        icon: '🔢',
        settings: [
            {
                key: 'mode', label: 'Режим', type: 'select', options: [
                    { value: 'standard', label: 'Шульте (стандарт)' },
                    { value: 'red-black', label: 'Шульте-Горбов' }
                ], default: 'standard'
            },
            {
                key: 'gridSize', label: 'Размер поля', type: 'select', options: [
                    { value: '3', label: '3×3' },
                    { value: '4', label: '4×4' },
                    { value: '5', label: '5×5' }
                ], default: '5'
            },
            { key: 'useLeadingZeros', label: 'Ведущие нули', type: 'checkbox', default: false },
            { key: 'useShuffle', label: 'Перемешивание', type: 'checkbox', default: false }
        ]
    },
    {
        id: 'n-back',
        name: 'N-back',
        icon: '🧠',
        settings: [
            {
                key: 'mode', label: 'Режим', type: 'select', options: [
                    { value: 'letters', label: 'Буквы' },
                    { value: 'shapes', label: 'Фигуры' }
                ], default: 'letters'
            },
            { key: 'n', label: 'Уровень N', type: 'range', min: 1, max: 5, step: 1, default: 2 },
            { key: 'intervalMs', label: 'Скорость (сек)', type: 'range', min: 1000, max: 5000, step: 500, default: 3000 }
        ]
    },
    {
        id: 'correction-test',
        name: 'Корректурная проба',
        icon: '✏️',
        settings: [
            {
                key: 'mode', label: 'Режим', type: 'select', options: [
                    { value: 'letters', label: 'Буквы' },
                    { value: 'numbers', label: 'Цифры' },
                    { value: 'rings', label: 'Кольца Ландольта' }
                ], default: 'letters'
            },
            { key: 'signCount', label: 'Количество знаков', type: 'range', min: 50, max: 300, step: 50, default: 100 }
        ]
    },
    {
        id: 'munsterberg-test',
        name: 'Тест Мюнстенберга',
        icon: '🔍',
        settings: [
            { key: 'showHints', label: 'Показать подсказки', type: 'checkbox', default: false }
        ]
    },
    {
        id: 'alphabet-game',
        name: 'Алфавит',
        icon: '🔤',
        settings: [
            {
                key: 'mode', label: 'Режим', type: 'select', options: [
                    { value: 'letters', label: 'Буквы' },
                    { value: 'numbers', label: 'Цифры' },
                    { value: 'fingers', label: 'Пальцы' }
                ], default: 'letters'
            },
            { key: 'speed', label: 'Скорость (сек)', type: 'range', min: 1, max: 5, step: 0.5, default: 2 },
            { key: 'isX2Mode', label: '+ноги', type: 'checkbox', default: false }
        ]
    },
    {
        id: 'calcudoku',
        name: 'Калькудоку',
        icon: '🧮',
        settings: [
            {
                key: 'size', label: 'Размер поля', type: 'select', options: [
                    { value: '3', label: '3×3' },
                    { value: '4', label: '4×4' },
                    { value: '5', label: '5×5' },
                    { value: '6', label: '6×6' }
                ], default: '4'
            },
            {
                key: 'ops', label: 'Операции', type: 'select', options: [
                    { value: '+', label: 'Только +' },
                    { value: '+-', label: '+ и −' },
                    { value: '*/', label: '× и ÷' },
                    { value: '+-*/', label: 'Все' }
                ], default: '+-'
            }
        ]
    },
    {
        id: 'counting-game',
        name: 'Считалка',
        icon: '📊',
        settings: [
            {
                key: 'mode', label: 'Режим чисел', type: 'select', options: [
                    { value: 'single', label: '1-10' },
                    { value: 'series', label: '1-50' }
                ], default: 'single'
            },
            {
                key: 'gridSize', label: 'Размер поля', type: 'select', options: [
                    { value: '3x3', label: '3×3' },
                    { value: '3x4', label: '3×4' },
                    { value: '4x4', label: '4×4' }
                ], default: '3x3'
            }
        ]
    },
    {
        id: 'magic-forest',
        name: 'Волшебный лес',
        icon: '🌲',
        settings: [
            { key: 'level', label: 'Уровень', type: 'range', min: 1, max: 10, step: 1, default: 1 },
            { key: 'showAnimalNames', label: 'Показывать названия', type: 'checkbox', default: true },
            { key: 'previewDuration', label: 'Время показа (сек)', type: 'range', min: 1, max: 10, step: 1, default: 4 }
        ]
    },
    {
        id: 'speed-reading',
        name: 'Турбочтение',
        icon: '📖',
        settings: [
            { key: 'duration', label: 'Время выполнения (сек)', type: 'range', min: 30, max: 300, step: 30, default: 60 },
            { key: 'letterCount', label: 'Букв в слове', type: 'range', min: 3, max: 8, step: 1, default: 5 },
            { key: 'displayTime', label: 'Время показа', type: 'range', min: 0.3, max: 2, step: 0.1, default: 0.5 },
            { key: 'fontSize', label: 'Размер шрифта', type: 'range', min: 3, max: 10, step: 1, default: 6 }
        ]
    }
];

export const LessonsManageView = {
    render() {
        const school = Store.getCurrentSchool();
        if (!school) {
            window.location.hash = '/school-login';
            return document.createElement('div');
        }

        const container = document.createElement('div');
        container.className = 'container lessons-manage';

        container.innerHTML = `
      <header class="admin-header">
        <div class="header-left">
          <a href="#/school-dashboard" class="btn btn-link">← Назад</a>
          <h1>Управление занятиями</h1>
        </div>
        <button id="create-lesson-btn" class="btn btn-primary">+ Создать занятие</button>
      </header>
      
      <div id="lessons-list" class="lessons-grid mt-lg">
        <p class="text-light">Загрузка...</p>
      </div>
    `;

        return container;
    },

    mounted() {
        const school = Store.getCurrentSchool();
        this.renderLessons(school.id);

        document.getElementById('create-lesson-btn').addEventListener('click', () => {
            this.showCreateLessonModal(school.id);
        });
    },

    async renderLessons(schoolId) {
        const list = document.getElementById('lessons-list');
        const lessons = await Store.getLessons(schoolId);

        if (lessons.length === 0) {
            list.innerHTML = `
        <div class="empty-state text-center">
          <h3>Нет созданных занятий</h3>
          <p class="text-light">Создайте первое занятие для ваших учеников</p>
        </div>
      `;
            return;
        }

        list.innerHTML = lessons.map(lesson => {
            const dateStr = lesson.scheduled_date
                ? new Date(lesson.scheduled_date).toLocaleDateString('ru-RU')
                : 'Без даты';

            return `
        <div class="lesson-card card">
          <div class="lesson-header">
            <h3>${lesson.title}</h3>
            <span class="badge">${lesson.exercise_count} упр.</span>
          </div>
          <p class="text-sm text-light">${lesson.description || 'Без описания'}</p>
          <div class="lesson-meta mt-sm">
            <span class="text-sm">📅 ${dateStr}</span>
            <span class="text-sm">👤 ${lesson.assigned_count} учен.</span>
          </div>
          <div class="lesson-actions mt-md">
            <button class="btn btn-sm btn-outline edit-lesson-btn" data-id="${lesson.id}">Редактировать</button>
            <button class="btn btn-sm btn-danger delete-lesson-btn" data-id="${lesson.id}">Удалить</button>
          </div>
        </div>
      `;
        }).join('');

        // Edit listeners
        list.querySelectorAll('.edit-lesson-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                window.location.hash = `/school-dashboard/lessons/${btn.dataset.id}`;
            });
        });

        // Delete listeners
        list.querySelectorAll('.delete-lesson-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Удалить это занятие?')) {
                    await Store.deleteLesson(btn.dataset.id);
                    this.renderLessons(schoolId);
                }
            });
        });
    },

    showCreateLessonModal(schoolId) {
        const existingModal = document.getElementById('lesson-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'lesson-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
      <div class="modal-content card">
        <h3>Создать занятие</h3>
        <form id="create-lesson-form" class="mt-md">
          <div class="form-group">
            <label>Название занятия</label>
            <input type="text" name="title" class="form-input" required placeholder="Тренировка внимания">
          </div>
          <div class="form-group">
            <label>Описание (необязательно)</label>
            <textarea name="description" class="form-input" rows="2" placeholder="Краткое описание занятия"></textarea>
          </div>
          <div class="form-group">
            <label>Дата показа (необязательно)</label>
            <input type="date" name="scheduled_date" class="form-input">
            <p class="text-xs text-light mt-xs">Если указана — ученик увидит занятие только в этот день и позже</p>
          </div>
          <div class="modal-actions mt-md">
            <button type="button" id="cancel-lesson-btn" class="btn btn-outline">Отмена</button>
            <button type="submit" class="btn btn-primary">Создать</button>
          </div>
        </form>
      </div>
    `;
        document.body.appendChild(modal);

        document.getElementById('cancel-lesson-btn').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

        document.getElementById('create-lesson-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);

            const lesson = await Store.createLesson({
                school_id: schoolId,
                title: formData.get('title'),
                description: formData.get('description'),
                scheduled_date: formData.get('scheduled_date') || null
            });

            modal.remove();

            if (lesson) {
                // Navigate to editor
                window.location.hash = `/school-dashboard/lessons/${lesson.id}`;
            }
        });
    }
};

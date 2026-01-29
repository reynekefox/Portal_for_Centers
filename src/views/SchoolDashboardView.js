import { Store } from '../store.js';

// List of available games
const AVAILABLE_GAMES = [
  { id: 'stroop-test', name: 'Тест Струпа' },
  { id: 'schulte-table', name: 'Таблица Шульте' },
  { id: 'munsterberg-test', name: 'Тест Мюнстенберга' },
  { id: 'alphabet-game', name: 'Алфавит' },
  { id: 'n-back', name: 'N-back' },
  { id: 'correction-test', name: 'Корректурная проба' },
  { id: 'calcudoku', name: 'Калькудоку' },
  { id: 'counting-game', name: 'Считалка' },
  { id: 'magic-forest', name: 'Волшебный лес' },
  { id: 'speed-reading', name: 'Турбочтение' }
];

function renderGameCheckboxes(prefix = 'new', selectedGames = []) {
  return AVAILABLE_GAMES.map(game => `
    <label class="game-checkbox">
      <input type="checkbox" name="${prefix}_games" value="${game.id}" 
             ${selectedGames.includes(game.id) ? 'checked' : ''}>
      <span>${game.name}</span>
    </label>
  `).join('');
}

export const SchoolDashboardView = {
  render() {
    const school = Store.getCurrentSchool();
    if (!school) {
      window.location.hash = '/school-login';
      return document.createElement('div');
    }

    const container = document.createElement('div');
    container.className = 'container school-dashboard';

    container.innerHTML = `
      <header class="admin-header">
        <h1>Личный кабинет: ${school.title}</h1>
        <div class="header-actions">
          <a href="#/school-dashboard/lessons" class="btn btn-secondary">📚 Занятия</a>
          <button id="school-logout-btn" class="btn btn-outline">Выйти</button>
        </div>
      </header>
      
      <div class="dashboard-content">
        <!-- School Profile Card -->
        <div class="card">
          <h3>Профиль школы</h3>
          <form id="school-profile-form" class="mt-md">
            <div class="form-group">
              <label>Название школы</label>
              <input type="text" name="title" class="form-input" value="${school.title}" required>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label>Логин</label>
                <input type="text" name="login" class="form-input" value="${school.login}" required>
              </div>
              <div class="form-group">
                <label>Пароль</label>
                <input type="text" name="password" class="form-input" value="${school.password || ''}" required>
              </div>
            </div>
            <button type="submit" class="btn btn-primary mt-sm">Сохранить изменения</button>
            <p id="save-success" class="success-text hidden mt-sm">Изменения сохранены!</p>
          </form>
        </div>
        
        <!-- Students Section -->
        <div class="card mt-xl">
          <h3>Ученики</h3>
          <form id="create-student-form" class="mt-md">
            <div class="form-grid">
              <div class="form-group">
                <label>Имя</label>
                <input type="text" name="firstName" class="form-input" required placeholder="Иван">
              </div>
              <div class="form-group">
                <label>Фамилия</label>
                <input type="text" name="lastName" class="form-input" required placeholder="Иванов">
              </div>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label>Логин</label>
                <input type="text" name="login" class="form-input" required placeholder="Логин для входа">
              </div>
              <div class="form-group">
                <label>Пароль</label>
                <input type="text" name="password" class="form-input" required placeholder="Пароль для входа">
              </div>
            </div>
            
            <div class="form-group mt-md">
              <label>Доступные игры:</label>
              <div class="games-checkbox-grid">
                ${renderGameCheckboxes('new')}
              </div>
              <button type="button" id="select-all-games" class="btn btn-link mt-sm">Выбрать все</button>
            </div>
            
            <button type="submit" class="btn btn-primary mt-md">Добавить ученика</button>
          </form>
          
          <div id="student-list" class="student-list mt-lg">
            <p class="text-light">Загрузка...</p>
          </div>
        </div>
      </div>
    `;

    return container;
  },

  mounted() {
    const profileForm = document.getElementById('school-profile-form');
    const studentForm = document.getElementById('create-student-form');
    const logoutBtn = document.getElementById('school-logout-btn');
    const selectAllBtn = document.getElementById('select-all-games');
    const school = Store.getCurrentSchool();

    this.renderStudents(school.id);

    // Select all games button
    selectAllBtn.addEventListener('click', () => {
      const checkboxes = studentForm.querySelectorAll('input[name="new_games"]');
      const allChecked = Array.from(checkboxes).every(cb => cb.checked);
      checkboxes.forEach(cb => cb.checked = !allChecked);
      selectAllBtn.textContent = allChecked ? 'Выбрать все' : 'Снять все';
    });

    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(profileForm);
      await Store.updateSchool(school.id, {
        title: formData.get('title'),
        login: formData.get('login'),
        password: formData.get('password')
      });

      document.querySelector('.admin-header h1').textContent = `Личный кабинет: ${formData.get('title')}`;

      const successMsg = document.getElementById('save-success');
      successMsg.classList.remove('hidden');
      setTimeout(() => successMsg.classList.add('hidden'), 3000);
    });

    studentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(studentForm);

      // Get selected games
      const selectedGames = Array.from(studentForm.querySelectorAll('input[name="new_games"]:checked'))
        .map(cb => cb.value);

      await Store.addStudent({
        school_id: school.id,
        first_name: formData.get('firstName'),
        last_name: formData.get('lastName'),
        login: formData.get('login'),
        password: formData.get('password'),
        allowed_games: selectedGames
      });
      studentForm.reset();
      this.renderStudents(school.id);
    });

    logoutBtn.addEventListener('click', () => {
      Store.schoolLogout();
    });
  },

  async renderStudents(schoolId) {
    const list = document.getElementById('student-list');
    const students = await Store.getStudents(schoolId);

    if (students.length === 0) {
      list.innerHTML = '<p class="text-light">Нет добавленных учеников.</p>';
      return;
    }

    list.innerHTML = students.map(student => {
      const games = student.allowed_games || [];
      const gameCount = games.length;
      return `
          <div class="student-item card">
            <div class="student-info">
              <h4>${student.first_name} ${student.last_name}</h4>
              <p class="text-sm text-light">Логин: <strong>${student.login}</strong> | Пароль: <strong>${student.password}</strong></p>
              <p class="text-sm text-light">Игры: <strong>${gameCount} из ${AVAILABLE_GAMES.length}</strong></p>
            </div>
            <div class="school-actions">
              <button class="btn-icon edit-student-btn" data-id="${student.id}" title="Редактировать">✎</button>
              <button class="btn-icon delete-student-btn" data-id="${student.id}" title="Удалить">✕</button>
            </div>
          </div>
        `;
    }).join('');

    // Delete listeners
    list.querySelectorAll('.delete-student-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await Store.deleteStudent(btn.dataset.id);
        this.renderStudents(schoolId);
      });
    });

    // Edit listeners
    list.querySelectorAll('.edit-student-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.showEditStudentModal(btn.dataset.id, schoolId);
      });
    });
  },

  async showEditStudentModal(studentId, schoolId) {
    const student = await Store.getStudentById(studentId);
    if (!student) return;

    const existingModal = document.getElementById('edit-modal');
    if (existingModal) existingModal.remove();

    const selectedGames = student.allowed_games || [];

    const modal = document.createElement('div');
    modal.id = 'edit-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
          <div class="modal-content card">
            <h3>Редактировать ученика</h3>
            <form id="edit-student-form" class="mt-md">
              <input type="hidden" name="id" value="${student.id}">
              <div class="form-grid">
                <div class="form-group">
                  <label>Имя</label>
                  <input type="text" name="firstName" class="form-input" value="${student.first_name}" required>
                </div>
                <div class="form-group">
                  <label>Фамилия</label>
                  <input type="text" name="lastName" class="form-input" value="${student.last_name}" required>
                </div>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label>Логин</label>
                  <input type="text" name="login" class="form-input" value="${student.login}" required>
                </div>
                <div class="form-group">
                  <label>Пароль</label>
                  <input type="text" name="password" class="form-input" value="${student.password}" required>
                </div>
              </div>
              
              <div class="form-group mt-md">
                <label>Доступные игры:</label>
                <div class="games-checkbox-grid">
                  ${renderGameCheckboxes('edit', selectedGames)}
                </div>
              </div>
              
              <div class="modal-actions mt-md">
                <button type="button" id="cancel-edit-btn" class="btn btn-outline">Отмена</button>
                <button type="submit" class="btn btn-primary">Сохранить</button>
              </div>
            </form>
          </div>
        `;
    document.body.appendChild(modal);

    document.getElementById('cancel-edit-btn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('edit-student-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);

      // Get selected games
      const selectedGames = Array.from(modal.querySelectorAll('input[name="edit_games"]:checked'))
        .map(cb => cb.value);

      await Store.updateStudent(formData.get('id'), {
        first_name: formData.get('firstName'),
        last_name: formData.get('lastName'),
        login: formData.get('login'),
        password: formData.get('password'),
        allowed_games: selectedGames
      });
      modal.remove();
      this.renderStudents(schoolId);
    });
  }
};

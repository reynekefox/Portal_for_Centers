import { Store } from '../store.js';

export const AdminView = {
  render() {
    const container = document.createElement('div');
    container.className = 'container admin-layout';

    container.innerHTML = `
      <header class="admin-header">
        <h1>Панель администратора</h1>
        <button id="logout-btn" class="btn btn-outline">Выйти</button>
      </header>
      
      <div class="admin-content">
        <!-- Create School Form -->
        <div class="card">
          <h3>Создать школу</h3>
          <form id="create-school-form" class="mt-md">
            <div class="form-group">
              <label>Название школы</label>
              <input type="text" name="title" class="form-input" required>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label>Логин</label>
                <input type="text" name="login" class="form-input" required>
              </div>
              <div class="form-group">
                <label>Пароль</label>
                <input type="text" name="password" class="form-input" required>
              </div>
            </div>
            <button type="submit" class="btn btn-primary mt-sm">Добавить школу</button>
          </form>
        </div>
        
        <!-- School List -->
        <div class="mt-xl">
          <h3>Список школ</h3>
          <div id="school-list" class="school-list mt-md">
            <p class="text-light">Загрузка...</p>
          </div>
        </div>
      </div>
    `;

    return container;
  },

  mounted() {
    const form = document.getElementById('create-school-form');
    const logoutBtn = document.getElementById('logout-btn');

    this.renderSchools();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const school = {
        title: formData.get('title'),
        login: formData.get('login'),
        password: formData.get('password')
      };

      await Store.addSchool(school);
      form.reset();
      this.renderSchools();
    });

    logoutBtn.addEventListener('click', () => {
      Store.logout();
    });
  },

  async renderSchools() {
    const list = document.getElementById('school-list');
    const schools = await Store.getSchools();

    if (schools.length === 0) {
      list.innerHTML = '<p class="text-light">Нет добавленных школ.</p>';
      return;
    }

    list.innerHTML = schools.map(school => `
      <div class="school-item card">
        <div class="school-info">
          <h4>${school.title}</h4>
          <p class="text-sm text-light">Логин: <strong>${school.login}</strong> | Пароль: <strong>${school.password}</strong></p>
        </div>
        <div class="school-actions">
          <button class="btn-icon edit-btn" data-id="${school.id}" title="Редактировать">✎</button>
          <button class="btn-icon delete-btn" data-id="${school.id}" title="Удалить">✕</button>
        </div>
      </div>
    `).join('');

    // Add delete listeners
    list.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await Store.deleteSchool(btn.dataset.id);
        this.renderSchools();
      });
    });

    // Add edit listeners
    list.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.showEditModal(btn.dataset.id);
      });
    });
  },

  async showEditModal(schoolId) {
    const school = await Store.getSchoolById(schoolId);
    if (!school) return;

    // Remove existing modal
    const existingModal = document.getElementById('edit-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'edit-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
          <div class="modal-content card">
            <h3>Редактировать школу</h3>
            <form id="edit-school-form" class="mt-md">
              <input type="hidden" name="id" value="${school.id}">
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
                  <input type="text" name="password" class="form-input" value="${school.password}" required>
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

    // Close modal logic
    document.getElementById('cancel-edit-btn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    // Submit logic
    document.getElementById('edit-school-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      await Store.updateSchool(formData.get('id'), {
        title: formData.get('title'),
        login: formData.get('login'),
        password: formData.get('password')
      });
      modal.remove();
      this.renderSchools();
    });
  }
};

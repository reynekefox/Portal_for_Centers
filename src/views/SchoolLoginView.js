import { Store } from '../store.js';

export const SchoolLoginView = {
  render() {
    const container = document.createElement('div');
    container.className = 'view-container';

    container.innerHTML = `
      <div class="card login-card">
        <h2 class="text-center mb-md">Вход для школы / ученика</h2>
        <form id="school-login-form">
          <div class="form-group">
            <label>Логин</label>
            <input type="text" name="login" class="form-input" required placeholder="Введите логин">
          </div>
          <div class="form-group">
            <label>Пароль</label>
            <input type="password" name="password" class="form-input" required placeholder="Введите пароль">
          </div>
          <p id="error-msg" class="error-text hidden">Неверный логин или пароль</p>
          <button type="submit" class="btn btn-primary w-full">Войти</button>
        </form>
        <p class="text-center mt-md text-sm text-light">
          <a href="#/login" class="link">Вход для администратора</a>
        </p>
      </div>
    `;

    return container;
  },

  mounted() {
    const form = document.getElementById('school-login-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const login = formData.get('login');
      const password = formData.get('password');

      // Try school login first
      const school = await Store.schoolLogin(login, password);
      if (school) {
        window.location.hash = '/school';
        return;
      }

      // Try student login
      const student = await Store.studentLogin(login, password);
      if (student) {
        window.location.hash = '/games';
        return;
      }

      // Neither matched
      document.getElementById('error-msg').classList.remove('hidden');
    });
  }
};


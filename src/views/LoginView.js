import { Store } from '../store.js';

export const LoginView = {
  render() {
    const container = document.createElement('div');
    container.className = 'view-container';

    container.innerHTML = `
      <div class="card login-card">
        <h2 class="text-center mb-md">Вход для администратора</h2>
        <form id="login-form">
          <div class="form-group">
            <label>Логин</label>
            <input type="text" name="username" class="form-input" required placeholder="admin">
          </div>
          <div class="form-group">
            <label>Пароль</label>
            <input type="password" name="password" class="form-input" required placeholder="admin">
          </div>
          <p id="error-msg" class="error-text hidden">Неверный логин или пароль</p>
          <button type="submit" class="btn btn-primary w-full">Войти</button>
        </form>
      </div>
    `;

    return container;
  },

  mounted() {
    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const success = await Store.login(formData.get('username'), formData.get('password'));

      if (success) {
        window.location.hash = 'admin';
      } else {
        document.getElementById('error-msg').classList.remove('hidden');
      }
    });
  }
};

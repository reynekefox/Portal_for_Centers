export const HomeView = {
  render() {
    const container = document.createElement('main');
    container.className = 'hero';

    container.innerHTML = `
      <h1 class="hero-title text-center">Профессиональный портал для детских центров</h1>
      <p class="hero-subtitle text-center">
        Этот портал создан для российских детских центров и предоставляет массу бесплатных тренажеров для детей.
      </p>
      
      <div class="actions">
        <a href="#/school-login" class="btn btn-primary">Войти как Школа</a>
        <a href="#/login" class="btn btn-outline">Войти как Администратор</a>
      </div>
    `;

    return container;
  }
};

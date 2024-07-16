'use-strict';
const completionRangeContainers = document.querySelectorAll(
  '.completion-range-scale-container'
);
const mainNavEl = document.querySelector('.main-nav');
const mainNavLogoutButton = document.querySelector('#main-nav-logout-button');
const forms = document.querySelectorAll('form');

forms.forEach((form) =>
  form.addEventListener('submit', (e) => e.preventDefault())
);

// Timeouts
setTimeout(() => mainNavEl.classList.add('main-nav-hidden'), 2500);

// Messages Manager
class DialogBox {
  constructor(message, title) {
    this.msg = message;
    this.title = title;
  }

  async prompt() {
    try {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      const compiledBoxReq = await fetch('/api/v1/pugify/dialog-box', {
        method: 'POST',
        body: JSON.stringify({ title: this.title, message: this.msg }),
        headers,
      });

      const body = await compiledBoxReq.json();
      if (body.status !== 'success') throw 'error';

      const compiledHTML = body.data.html;

      const element = document.createElement('div');
      element.classList.add('main-dialog-box');
      element.innerHTML = compiledHTML;

      document.body.insertAdjacentElement('afterbegin', element);

      this.element = element;

      element
        .querySelector('.main-dialog-btn')
        .addEventListener('click', () => element.remove());
    } catch (e) {
      console.log(e);
    }
  }

  hide() {
    this.element.remove();
  }
}

// Telling user about cookies
(function () {
  if (localStorage.getItem('acceptedCookies')) return;
  new DialogBox(
    'By proceeding into this website, you accept that this webpage is using cookies',
    'بإكمالك إلى هذه الصفحه أنت توافق أن الصفحه تستخدم الكوكيز'
  ).prompt();
  localStorage.setItem('acceptedCookies', 'true');
})();

// Event Handlers
completionRangeContainers?.forEach((completionRangeContainer) => {
  const progressBar = completionRangeContainer.querySelector(
    '.completion-range-scale-done'
  );
  progressBar.style.width = `${progressBar.getAttribute('value')}%`;
});

document.addEventListener('mousemove', function (event) {
  // Get the vertical position of the cursor
  const cursorY = event.clientY;

  // Get the height of the window
  const windowHeight = window.innerHeight;

  if (
    windowHeight - cursorY <= 50 &&
    mainNavEl.classList.contains('main-nav-hidden')
  ) {
    mainNavEl.classList.remove('main-nav-hidden');
    setTimeout(() => mainNavEl.classList.add('main-nav-hidden'), 2500);
  }
});

mainNavLogoutButton?.addEventListener('click', async () => {
  await fetch('/api/v1/users/logout', { method: 'POST' });

  location.reload();
});

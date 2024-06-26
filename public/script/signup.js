const signupForm = document.querySelector('.signup-form');

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formDataObject = Object.fromEntries(new FormData(signupForm).entries());

  try {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    const response = await fetch('/api/v1/users/signup', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(formDataObject),
    });

    const body = await response.json();

    if (body.status !== 'success') throw { message: body.message };

    const dialogbox = new DialogBox(
      'سيتم تحويلك الى الصفحه الرئيسيه خلال ثواني',
      'تم إنشاء الحساب'
    );
    dialogbox.prompt();

    setTimeout(() => {
      window.location = '/';
    }, 2000);
  } catch (e) {
    const dialogbox = new DialogBox(e.message, 'حدث خطأ');
    dialogbox.prompt();
  }
});

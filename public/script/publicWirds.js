const joinPublicWirdButton = document.querySelectorAll('.join-publicWird-btn');
const pageInput = document.querySelector('#public-wirds-list-page-input');
const publicWirdsSection = document.querySelector(
  '.S-public-wirds#S-public-wirds'
);
const dataEl = document.querySelector('data');

joinPublicWirdButton.forEach((btn) => {
  btn.addEventListener('click', async () => {
    try {
      btn.classList.add('disabled-button');

      const response = await fetch(
        `/api/v1/wirds/public/${btn.getAttribute('wird-un')}`,
        {
          method: 'POST',
        }
      );

      const body = await response.json();

      if (body.status !== 'success') throw new Error(body.message);
      else
        new DialogBox(
          'تم إدخالك الى الورد، سيتم تحويلك اليه بغضون ثوان',
          'تمت العمليه بنجاح'
        ).prompt();

      setTimeout(
        () => (
          (window.location = '/wirds/public/' + btn.getAttribute('wird-id')),
          3000
        )
      );
    } catch (e) {
      new DialogBox(e.message, 'حدث خطأ').prompt();
    }
  });
});
e;

pageInput.addEventListener('change', async (e) => {
  try {
    const page = parseInt(pageInput.value);
    if (page < 1)
      page === 0
        ? (pageInput.value = 1)
        : (pageInput.value = Math.abs(pageInput.value));

    const wirdsRes = await fetch(
      `/api/v1/wirds/public?limit=10&page=${pageInput.value}`
    );

    const wirdsBody = await wirdsRes.json();

    if (wirdsBody.status !== 'success') throw new Error(wirdsBody.message);

    if (wirdsBody.data.wirds.length < 1) {
      pageInput.value = dataEl.getAttribute('page');
      throw new Error('لا يوجد نتائج أكثر');
    }

    const publicWirdsSectionHTMLRes = await fetch(
      `/api/v1/pugify/publicWirdsSection`,
      {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({
          wirds: wirdsBody.data.wirds,
        }),
      }
    );

    const publicWirdsSectionHTMLBody = await publicWirdsSectionHTMLRes.json();

    if (publicWirdsSectionHTMLBody.status !== 'success')
      throw new Error(publicWirdsSectionHTMLBody.message);

    publicWirdsSection.innerHTML = publicWirdsSectionHTMLBody.data.html;
    dataEl.setAttribute('page', `${pageInput.value}`);
  } catch (e) {
    new DialogBox(e.message, 'حدث خطأ').prompt();
  }
});

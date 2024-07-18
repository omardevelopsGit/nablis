'use strict';

const quranLines = document.querySelectorAll('.quran-line-percentage');
const mePageForms = document.querySelectorAll('form');
const dataElement = document.querySelector('data');

const createWirdForm = document.querySelector('form.create-wird');
const editWirdForm = document.querySelector('form.edit-wird');
const wirdEditInput = document.querySelector('#wird-edit-selection');
const wirdEditPage = document.querySelector('#edit-wird-pn-in');
const wirdEditVerse = document.querySelector('#edit-wird-vn-in');
const wirdsList = document.querySelector('.wirds-list');

const deleteWirdForm = document.querySelector('form.delete-wird');
const deleteWirdInput = document.querySelector('#delete-wird-in');

const addMeToTaskForm = document.querySelector('#watwf-add');
const markMeAsDoneWorkingForm = document.querySelector('#watwf-stop');

const addTaskForm = document.querySelector('form.acp-form.create-task-form');

const editTaskForm = document.querySelector('form.acp-form.edit-task-form');
const taskIdInputEdit = document.querySelector('#acp-edit-form-task');

const deleteTaskForm = document.querySelector('form.acp-form.delete-task-form');
const addRolesForm = document.querySelector('form.acp-form.add-roles-form');
const markTaskAsDoneForm = document.querySelector(
  'form.acp-form.mark-task-done-form'
);

const hifzAddForm = document.querySelector('.haf');
const hmsMain = document.querySelector('.hms-main');

const hifzVerificationForm = document.querySelector('.mvf');

const createPublicWirdForm = document.querySelector(
  'form.wird-management-form.create-public-wird-form'
);
const deletePublicWirdForm = document.querySelector(
  'form.wird-management-form.delete-public-wird-form'
);
const joinPublicWirdForm = document.querySelector(
  'form.wird-management-form.join-public-wird-form'
);
const publicWirdsShow = document.querySelector(
  'figure.wirds-show.public-wirds-show .wirds-list'
);

quranLines.forEach((e) => {
  e.style.width = `${e.getAttribute('percentage')}%`;
});

// General Functions
function formToObject(form) {
  // Converts form to object
  // Create an empty object to store form data
  const data = {};

  // Loop through all form elements
  for (const element of form.elements) {
    // Check if element has a name attribute and is not disabled
    if (element.name && !element.disabled) {
      // Get the element type and value
      const type = element.type;
      const value = element.value;

      // Handle different input types
      switch (type) {
        case 'checkbox':
        case 'radio':
          // If checkbox or radio is checked, add its value to the object
          if (element.checked) {
            data[element.name] = value;
          }
          break;
        default:
          // For other input types, add the value to the object
          data[element.name] = isNaN(+value) ? value : +value;
      }
    }
  }

  // Return the object containing form data
  return data;
}

function getRange(start, end) {
  let range = [];

  if (start <= end) {
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
  } else {
    for (let i = start; i >= end; i--) {
      range.push(i);
    }
  }

  return range;
}

function removeDisabledBtnCls(form) {
  const submitButton = form.querySelector('button[type="submit"]');
  console.log(submitButton);
  submitButton.classList.remove('disabled-button');
}

function fillFormFromObject(form, data) {
  Object.entries(data).forEach(([key, value]) => {
    const input = form.querySelector(`.input[name="${key}"]`);

    if (input) input.value = value;
  });
}
// Class

class FormHandler {
  constructor(form, handler, successMsg) {
    this.form = form;
    this.handler = handler;
    this.terminated = true;
    this.scsMsg = successMsg;
  }

  terminate() {
    this.terminated = true;
  }

  acitvate(url, data) {
    this.data = Object.assign({}, data);
    this.url = url;
    this.terminated = false;

    this.form.addEventListener('submit', async (e) => {
      if (this.terminated) return removeDisabledBtnCls(this.form);

      try {
        this.formData = formToObject(this.form);

        if (data.body) data.body = this.data.body(this.formData);
        if (typeof this.url === 'function') url = this.url(this.formData);

        const response = await fetch(url, data);

        // Catch if the status code of the response is 204
        let responseBody;

        try {
          responseBody = await response.json();
        } catch (e) {
          responseBody = { status: 'success' };
        }

        if (responseBody.status !== 'success')
          throw new Error(responseBody.message);
        else new DialogBox(this.scsMsg, 'تمت العمليه بنجاح').prompt();

        await this.handler(responseBody, this.formData);
        removeDisabledBtnCls(this.form);
        return;
      } catch (e) {
        removeDisabledBtnCls(this.form);
        fillFormFromObject(this.form, this.formData);
        return new DialogBox(e.message, 'حدث خطأ').prompt();
      }
    });
  }
}

// Handling Wirds Management features

// Create Wird Form
if (createWirdForm) {
  const createWirdFormHandler = new FormHandler(
    createWirdForm,
    async function (body) {
      // Adding wird to ui
      // Adding to wirds list
      const wirdItemResponse = await fetch('/api/v1/pugify/me-wirdListItem', {
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ wird: body.data.wird }),
        method: 'POST',
      });

      const wirdItemBody = await wirdItemResponse.json();
      if (wirdItemBody.status !== 'success')
        throw new Error(wirdItemBody.message);
      const wirdHTML = wirdItemBody.data.html;

      wirdsList.insertAdjacentHTML('afterbegin', wirdHTML);

      // Adding to select inputs in delete and update forms
      const wirdOptionResponse = await fetch(
        '/api/v1/pugify/me-wirdOptionItem',
        {
          headers: { 'Content-type': 'application/json' },
          body: JSON.stringify({ wird: body.data.wird }),
          method: 'POST',
        }
      );

      const wirdOptionBody = await wirdOptionResponse.json();
      if (wirdOptionBody.status !== 'success')
        throw new Error(wirdOptionBody.message);
      const wirdOptionHTML = wirdOptionBody.data.html;

      [editWirdForm, deleteWirdForm].forEach((form) => {
        const selectInput = form.querySelector(`select.input`);
        selectInput.insertAdjacentHTML('afterbegin', wirdOptionHTML);
      });
    },
    'تم إنشاء وردك بنجاح'
  );
  createWirdFormHandler.acitvate('/api/v1/wirds', {
    headers: { 'Content-type': 'application/json' },
    body(formData) {
      return JSON.stringify(formData);
    },
    method: 'POST',
  });
}

//  Update Wird Form+
if (wirdEditInput)
  wirdEditInput.addEventListener('change', async (e) => {
    e.preventDefault();

    const response = await fetch(`/api/v1/wirds/${wirdEditInput.value.trim()}`);

    const body = await response.json();

    if (body.status !== 'success')
      return new DialogBox(body.message, 'لم نتمكن من الحصول على معلومات وردك');

    wirdEditPage.value = body.data.wird.page;
    wirdEditVerse.value = body.data.wird.verse;
  });

if (editWirdForm) {
  const editWirdFormHandler = new FormHandler(
    editWirdForm,
    async function () {
      return;
    },
    'تم تحديث وردك بنجاح، نرجو إعادة تنشيط الصفحه لإظهار النتائج'
  );
  editWirdFormHandler.acitvate(`/api/v1/wirds/${wirdEditInput.value.trim()}`, {
    headers: { 'Content-type': 'application/json' },
    body(formData) {
      return JSON.stringify(formData);
    },
    method: 'PUT',
  });
}
// Delete Wird Form

if (deleteWirdForm) {
  const deleteWirdFormHandler = new FormHandler(
    deleteWirdForm,
    async function (body, formData) {
      // Removing wird li form the ui
      const wirdsListItem = Array.from(
        document.querySelectorAll(`.wirds-list-item`)
      ).find((item) => {
        return item.getAttribute('wird-id').trim() === formData.wird;
      });
      wirdsListItem?.remove();

      // Removing from select input of the forms
      [editWirdForm, deleteWirdForm].forEach((form) => {
        const optionItem = form.querySelector(
          `select.input option[value="${formData.wird}"]`
        );
        optionItem?.remove();
      });
    },
    'تم حذف وردك'
  );
  deleteWirdFormHandler.acitvate(
    () => `/api/v1/wirds/${deleteWirdInput.value.trim()}`,
    { method: 'DELETE' }
  );
}
// Handling Hifz Forms
if (hifzAddForm) {
  const hifzAddFormHandler = new FormHandler(
    hifzAddForm,
    async function (body, formData) {
      // Adding surah to ui
      const fullSurahs = JSON.parse(dataElement.getAttribute('surahs'));

      const surah = body.data.hifzProgress.find((surah) => {
        return surah.surah === +formData.surah;
      });
      surah.name = fullSurahs.data.find(
        (fullSurah) => fullSurah.number === surah.surah
      ).name;

      const hifzSurahAnchorRes = await fetch(
        '/api/v1/pugify/me-hifzSurahAnchor',
        {
          headers: { 'Content-type': 'application/json' },
          body: JSON.stringify({
            surah,
          }),
          method: 'POST',
        }
      );

      const hifzSurahAnchorBody = await hifzSurahAnchorRes.json();
      if (hifzSurahAnchorBody.status !== 'success')
        throw new Error(hifzSurahAnchorBody.message);
      const hifzHTML = hifzSurahAnchorBody.data.html;

      // Removing the old one if exists
      Array.from(hmsMain.querySelectorAll(`.hms-main-surah`))
        ?.find((el) => +el.getAttribute('surah') === surah.surah)
        ?.remove();

      hmsMain.insertAdjacentHTML('afterbegin', hifzHTML);
    },
    'تم إضافة السوره الى حفظك'
  );
  hifzAddFormHandler.acitvate(`/api/v1/users/me/hifz`, {
    headers: { 'Content-type': 'application/json' },
    body(formData) {
      console.log(formData);
      formData.verses = `${formData.verses}`
        .split(',')
        .map((verse) => {
          if (verse.includes('-')) {
            const [startingVerse, endingVerse] = verse
              .split('-')
              .map((verse) => Number(verse));

            return getRange(startingVerse, endingVerse);
          }
          return Number(verse);
        })
        .flat();

      formData.surah = +formData.surah;

      return JSON.stringify(formData);
    },
    method: 'PUT',
  });
}

if (hifzVerificationForm) {
  const hifzVerificationFormHandler = new FormHandler(
    hifzVerificationForm,
    async function (body, formData) {},
    'تم توثيق الحفظ'
  );
  hifzVerificationFormHandler.acitvate(
    (formData) => `/api/v1/users/hifz/${formData.username}/${formData.surah}`,
    { method: 'PUT' }
  );
}

// Tasks

if (addMeToTaskForm)
  addMeToTaskForm?.addEventListener('submit', async (e) => {
    try {
      const formData = formToObject(addMeToTaskForm);

      const response = await fetch(`/api/v1/tasks/${formData.task}/me`, {
        method: 'POST',
      });

      const body = await response.json();

      removeDisabledBtnCls(addMeToTaskForm);
      if (body.status !== 'success')
        new DialogBox(body.message, 'حدث خطأ').prompt();
      else
        new DialogBox(
          'تمت إضافتك إلى المهمه بنجاح',
          'تمت العمليه بنجاح'
        ).prompt();
    } catch (e) {
      new DialogBox(e.message, 'حدث خطأ').prompt();
    }
  });

if (markMeAsDoneWorkingForm)
  markMeAsDoneWorkingForm?.addEventListener('submit', async (e) => {
    try {
      const formData = formToObject(markMeAsDoneWorkingForm);

      const response = await fetch(`/api/v1/tasks/${formData.task}/me`, {
        method: 'PUT',
      });

      const body = await response.json();

      if (body.status !== 'success')
        new DialogBox(body.message, 'حدث خطأ').prompt();
      else
        new DialogBox(
          'تم إنهاء عملك بالمهمه بنجاح',
          'تمت العمليه بنجاح'
        ).prompt();
      removeDisabledBtnCls(markMeAsDoneWorkingForm);
    } catch (e) {
      new DialogBox(e.message, 'حدث خطأ').prompt();
    }
  });

// Administrator
//  Add Task Form

if (addTaskForm)
  addTaskForm?.addEventListener('submit', async (e) => {
    try {
      const formData = formToObject(addTaskForm);
      formData.assignedTo = formData.assignedTo.split(',').map((i) => i.trim());

      const response = await fetch(`/api/v1/tasks/`, {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const body = await response.json();
      removeDisabledBtnCls(addTaskForm);
      if (body.status !== 'success')
        new DialogBox(body.message, 'حدث خطأ').prompt();
      else new DialogBox('تم إنشاء المهمه', 'تمت العمليه بنجاح').prompt();
    } catch (e) {
      new DialogBox(e.message, 'حدث خطأ').prompt();
    }
  });

// Edit Task Form

if (editTaskForm)
  editTaskForm?.addEventListener('submit', async (e) => {
    try {
      const formData = formToObject(editTaskForm);
      formData.assignedTo = formData.assignedTo.split(',').map((i) => i.trim());

      const response = await fetch(`/api/v1/tasks/${formData.taskId}`, {
        method: 'PUT',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const body = await response.json();
      removeDisabledBtnCls(editTaskForm);
      if (body.status !== 'success')
        new DialogBox(body.message, 'حدث خطأ').prompt();
      else new DialogBox('تم تحديث المهمه', 'تمت العمليه بنجاح').prompt();
    } catch (e) {
      new DialogBox(e.message, 'حدث خطأ').prompt();
    }
  });

if (taskIdInputEdit)
  taskIdInputEdit?.addEventListener('change', async (e) => {
    try {
      const response = await fetch(`/api/v1/tasks/${taskIdInputEdit.value}`);

      const body = await response.json();
      console.log(body);

      if (body.status !== 'success') throw new Error(body.message);

      Object.keys(body.data.task).forEach((key) => {
        const element = editTaskForm.querySelector(`.input[name="${key}"]`);
        if (!element) return;
        element.value = body.data.task[key];
      });

      editTaskForm.querySelector('input[name="assignedTo"]').value =
        body.data.task.assignedTo.map((user) => user.username).join(', ');
    } catch (e) {
      return new DialogBox(
        e.message,
        'لم نتمكن من ايجاد معلومات المهمه'
      ).prompt();
    }
  });

// Delete Task Form

if (deleteTaskForm)
  deleteTaskForm?.addEventListener('submit', async (e) => {
    try {
      const formData = formToObject(deleteTaskForm);

      const response = await fetch(`/api/v1/tasks/${formData.taskId}`, {
        method: 'DELETE',
      });

      removeDisabledBtnCls(deleteTaskForm);

      if (!response.ok) throw new Error('غير معروف');
      else new DialogBox('تم حذف المهمه', 'تمت العمليه بنجاح').prompt();
    } catch (e) {
      new DialogBox(e.message, 'حدث خطأ').prompt();
    }
  });

if (addRolesForm) {
  const addRolesFormHandler = new FormHandler(
    addRolesForm,
    function () {},
    'تم إضافة رتب'
  );
  addRolesFormHandler.acitvate(
    (formData) => `/api/v1/users/${formData.username}/roles`,
    {
      method: 'POST',
      body: (formData) => {
        return JSON.stringify({
          roles: formData.roles.split(',').map((role) => role.trim()),
        });
      },
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

if (markTaskAsDoneForm) {
  const markTaskAsDoneFormHandler = new FormHandler(
    markTaskAsDoneForm,
    async function () {},
    'تم إنهاء المهمه (وضع عليها علامه كمنتهيه)'
  );
  markTaskAsDoneFormHandler.acitvate(
    (formData) => `/api/v1/tasks/${formData.taskId}`,
    {
      method: 'POST',
    }
  );
}

if (createPublicWirdForm) {
  const createPublicWirdFormHandler = new FormHandler(
    createPublicWirdForm,
    async function (body, formData) {
      body.data.user = JSON.parse(dataElement.getAttribute('user'));
      const response = await fetch(`/api/v1/pugify/me-publicWirdLI`, {
        method: 'POST',
        body: JSON.stringify(body.data),
        headers: {
          'Content-type': 'application/json',
        },
      });
      const wirdLIBody = await response.json();

      console.log(wirdLIBody);
      if (wirdLIBody.status !== 'success')
        return new DialogBox(
          'يمكنك إعادة تشغيل الصفحه لرؤية الورد',
          'لم نتمكن من إضافة الورد إلى الورود'
        ).prompt();

      publicWirdsShow.insertAdjacentHTML('afterbegin', wirdLIBody.data.html);
    },
    'تم إنشاء ورد عام'
  );
  createPublicWirdFormHandler.acitvate('/api/v1/wirds/public', {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body(formData) {
      return JSON.stringify(formData);
    },
  });
}

if (joinPublicWirdForm) {
  const joinPublicWirdFormHandler = new FormHandler(
    joinPublicWirdForm,
    async function (body, formData) {
      body.data.user = JSON.parse(dataElement.getAttribute('user'));
      const response = await fetch(`/api/v1/pugify/me-publicWirdLI`, {
        method: 'POST',
        body: JSON.stringify({
          ...body.data,
        }),
        headers: {
          'Content-type': 'application/json',
        },
      });

      const wirdLIBody = await response.json();

      if (wirdLIBody.status !== 'success')
        return new DialogBox(
          'يمكنك إعادة تشغيل الصفحه لرؤية الورد',
          'لم نتمكن من إضافة الورد إلى الورود'
        ).prompt();

      publicWirdsShow.insertAdjacentHTML('afterbegin', wirdLIBody.data.html);
    },
    'تم إدخالك إلى ورد عام'
  );
  joinPublicWirdFormHandler.acitvate(
    (formData) => `/api/v1/wirds/public/${formData.uniqueName}`,
    {
      method: 'POST',
    }
  );
}

if (deletePublicWirdForm) {
  const deletePublicWirdFormHandler = new FormHandler(
    deletePublicWirdForm,
    async function (body, formData) {
      publicWirdsShow
        .querySelector(`li.wirds-list-item[wird-id="${formData.uniqueName}"]`)
        .remove();
    },
    'تم حذف الورد بنجاح'
  );
  deletePublicWirdFormHandler.acitvate(
    (formData) => {
      return `/api/v1/wirds/public/${formData.uniqueName}`;
    },
    {
      method: 'DELETE',
    }
  );
}

//
//
//
//
// Nothing must be after this handler
mePageForms.forEach((form) => {
  form.addEventListener('submit', async (e) => {
    const inputs = form.querySelectorAll('.input');
    inputs.forEach((input) => {
      input.value = '';
    });

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.classList.add('disabled-button');
  });
});

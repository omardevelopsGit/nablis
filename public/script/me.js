'use strict';

const quranLines = document.querySelectorAll('.quran-line-percentage');
const forms = document.querySelectorAll('form');

quranLines.forEach((e) => {
  e.style.width = `${e.getAttribute('percentage')}%`;
});

forms.forEach((form) =>
  form.addEventListener('submit', (e) => e.preventDefault())
);

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
          data[element.name] = value;
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

// Handling Wirds Management features

// Create Wird Form
const createWirdForm = document.querySelector('form.create-wird');

createWirdForm.addEventListener('submit', async () => {
  try {
    const formData = formToObject(createWirdForm);

    const response = await fetch('/api/v1/wirds', {
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify(formData),
      method: 'POST',
    });

    const body = await response.json();

    if (body.status !== 'success')
      new DialogBox(body.message, 'حدث خطأ').prompt();
    else new DialogBox('تم إنشاء ورد جديد بنجاح', 'تمت العمليه بنجاح').prompt();
  } catch (e) {
    new DialogBox(e.message, 'حدث خطأ').prompt();
  }
});

//  Update Wird Form
const editWirdForm = document.querySelector('form.edit-wird');
const wirdEditInput = document.querySelector('#wird-edit-selection');
const wirdEditPage = document.querySelector('#edit-wird-pn-in');
const wirdEditVerse = document.querySelector('#edit-wird-vn-in');

wirdEditInput.addEventListener('change', async (e) => {
  e.preventDefault();

  const response = await fetch(`/api/v1/wirds/${wirdEditInput.value.trim()}`);

  const body = await response.json();

  if (body.status !== 'success')
    return new DialogBox(body.message, 'لم نتمكن من الحصول على معلومات وردك');

  wirdEditPage.value = body.data.wird.page;
  wirdEditVerse.value = body.data.wird.verse;
});

editWirdForm.addEventListener('submit', async () => {
  try {
    const formData = formToObject(editWirdForm);
    delete formData?.wird;

    const response = await fetch(
      `/api/v1/wirds/${wirdEditInput.value.trim()}`,
      {
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify(formData),
        method: 'PUT',
      }
    );

    const body = await response.json();

    if (body.status !== 'success')
      new DialogBox(body.message, 'حدث خطأ').prompt();
    else new DialogBox('تم تحديث وردك بنجاح', 'تمت العمليه بنجاح').prompt();
  } catch (e) {
    new DialogBox(e.message, 'حدث خطأ').prompt();
  }
});

// Delete Wird Form
const deleteWirdForm = document.querySelector('form.delete-wird');
const deleteWirdInput = document.querySelector('#delete-wird-in');

deleteWirdForm.addEventListener('submit', async () => {
  try {
    const response = await fetch(
      `/api/v1/wirds/${deleteWirdInput.value.trim()}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) new DialogBox(body.message, 'حدث خطأ').prompt();
    else new DialogBox('تم حذف وردك بنجاح', 'تمت العمليه بنجاح').prompt();
  } catch (e) {
    new DialogBox('حدث خطأ', e.message).prompt();
  }
});

// Handling Hifz Forms
const hifzAddForm = document.querySelector('.haf');

hifzAddForm.addEventListener('submit', async () => {
  try {
    const formData = formToObject(hifzAddForm);
    formData.verses = formData.verses
      .split(',')
      .map((verse) => {
        if (verse.includes('-')) {
          console.log(verse);
          const [startingVerse, endingVerse] = verse
            .split('-')
            .map((verse) => Number(verse));

          return getRange(startingVerse, endingVerse);
        }
        return Number(verse);
      })
      .flat();

    const response = await fetch(`/api/v1/users/me/hifz`, {
      method: 'PUT',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const body = await response.json();

    if (body.status !== 'success')
      new DialogBox(body.message, 'حدث خطأ').prompt();
    else new DialogBox('تم تحديث حفظك بنجاح', 'تمت العمليه بنجاح').prompt();
  } catch (e) {
    new DialogBox(e.message, 'حدث خطأ').prompt();
  }
});

const hifzVerificationForm = document.querySelector('.mvf');

hifzVerificationForm?.addEventListener('submit', async () => {
  try {
    const formData = formToObject(hifzVerificationForm);

    const response = await fetch(
      `/api/v1/users/hifz/${formData.username}/${formData.surah}`,
      {
        method: 'PUT',
      }
    );

    const body = await response.json();

    if (body.status !== 'success')
      new DialogBox(body.message, 'حدث خطأ').prompt();
    else new DialogBox('تم توثيق الحفظ بنجاح', 'تمت العمليه بنجاح').prompt();
  } catch (e) {
    new DialogBox(e.message, 'حدث خطأ').prompt();
  }
});

// Tasks
const addMeToTaskForm = document.querySelector('#watwf-add');
const markMeAsDoneWorkingForm = document.querySelector('#watwf-stop');

addMeToTaskForm?.addEventListener('submit', async (e) => {
  try {
    const formData = formToObject(addMeToTaskForm);

    const response = await fetch(`/api/v1/tasks/${formData.task}/me`, {
      method: 'POST',
    });

    const body = await response.json();

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
  } catch (e) {
    new DialogBox(e.message, 'حدث خطأ').prompt();
  }
});

// Administrator
//  Add Task Form
const addTaskForm = document.querySelector('form.acp-form.create-task-form');

addTaskForm.addEventListener('submit', async (e) => {
  try {
    const formData = formToObject(addTaskForm);
    formData.assignedTo = formData.assignedTo.split(',').map((i) => i.trim());

    const response = await fetch(`/api/v1/tasks/`, {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const body = await response.json();
    if (body.status !== 'success')
      new DialogBox(body.message, 'حدث خطأ').prompt();
    else new DialogBox('تم إنشاء المهمه', 'تمت العمليه بنجاح').prompt();
  } catch (e) {
    new DialogBox(e.message, 'حدث خطأ').prompt();
  }
});

// Edit Task Form
const editTaskForm = document.querySelector('form.acp-form.edit-task-form');
const taskIdInputEdit = document.querySelector('#acp-edit-form-task');

editTaskForm.addEventListener('submit', async (e) => {
  try {
    const formData = formToObject(editTaskForm);
    formData.assignedTo = formData.assignedTo.split(',').map((i) => i.trim());

    const response = await fetch(`/api/v1/tasks/${formData.taskId}`, {
      method: 'PUT',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const body = await response.json();
    if (body.status !== 'success')
      new DialogBox(body.message, 'حدث خطأ').prompt();
    else new DialogBox('تم تحديث المهمه', 'تمت العمليه بنجاح').prompt();
  } catch (e) {
    new DialogBox(e.message, 'حدث خطأ').prompt();
  }
});

taskIdInputEdit.addEventListener('change', async (e) => {
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
const deleteTaskForm = document.querySelector('form.acp-form.delete-task-form');

deleteTaskForm.addEventListener('submit', async (e) => {
  try {
    const formData = formToObject(deleteTaskForm);

    const response = await fetch(`/api/v1/tasks/${formData.taskId}`, {
      method: 'DELETE',
    });

    if (!response.ok) new DialogBox('عير معروف', 'حدث خطأ').prompt();
    else new DialogBox('تم حذف المهمه', 'تمت العمليه بنجاح').prompt();
  } catch (e) {
    new DialogBox(e.message, 'حدث خطأ').prompt();
  }
});

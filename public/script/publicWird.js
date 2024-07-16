'use strict';

const publicWirdsPageForms = document.querySelectorAll('form');
const addToWirdForm = document.querySelector('form.wap-add-to-wird-form');
const dataEl = document.querySelector('data');

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
        console.log(response);

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
        console.log(e);
        return new DialogBox(e.message, 'حدث خطأ').prompt();
      }
    });
  }
}

// Handling Add To Wird Form
const addToWirdFormHandler = new FormHandler(
  addToWirdForm,
  async () => {},
  'تمت الإضافه إلى وردك'
);
addToWirdFormHandler.acitvate(
  () => `/api/v1/wirds/${JSON.parse(dataEl.getAttribute('wird'))._id}`,
  {
    method: 'PUT',
    headers: {
      'Content-type': 'application/json',
    },
    body: (formData) => {
      return JSON.stringify(formData);
    },
  }
);

//
//
//
//
// Nothing must be after this handler
publicWirdsPageForms.forEach((form) => {
  form.addEventListener('submit', async (e) => {
    const inputs = form.querySelectorAll('.input');
    inputs.forEach((input) => {
      input.value = '';
    });

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.classList.add('disabled-button');
  });
});

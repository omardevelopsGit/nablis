const pug = require('pug');
const catchAsync = require('../utils/catchAsync.js');
const fs = require('fs');
const path = require('path');
const AppError = require('../utils/appError.js');

function readFile(...params) {
  return new Promise((resolve, reject) => {
    fs.readFile(...params, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

exports.pugify = catchAsync(async (req, res, next) => {
  // Pug Locals
  const pugLocals = req.body;

  // Read The Template
  const file = await readFile(
    path.join(__dirname, '../views/pugify', `${req.params.template}.pug`),
    'utf-8'
  );

  const pugCompiler = pug.compile(file);
  const compliledPug = pugCompiler(pugLocals);

  res.status(200).json({
    status: 'success',
    data: {
      html: compliledPug,
    },
  });
});

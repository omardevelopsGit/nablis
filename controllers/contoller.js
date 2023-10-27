const AppError = require('../utils/appError.js');
const catchAsync = require('../utils/catchAsync.js');
const Model = require('../models/model.js');
const emitter = require('./multiEmitController');
const model = require('../models/model.js');
const { default: mongoose } = require('mongoose');

exports.handler = catchAsync(async (req, res, next) => {
  next();
});

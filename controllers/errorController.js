const AppError = require('../utils/appError.js');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;

  return new AppError(message, 400);
};

const handleDuplicateErrorDB = (err) => {
  const value = err.message.match(/(["'])(\\?.)*?\1/)[0];
  const message = `لا يمكنك إدخال هذه القيمه نظرا لتكررها عندنا (${value})`;

  return new AppError(message, 400);
};

const handleVaildationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `لا يمكنك إدخال هذه المعلومات نظرا لأنها غير صحيحه: ${errors.join(
    '. '
  )}`;
  return new AppError(message, 400);
};

const handleJsonWebTokenErrorDB = (err) =>
  new AppError('هذا التوكن غير صحيح ولا يمكنك تسجيل الدخول بها', 401);

const handleTokenExpiredErrorDB = (err) =>
  new AppError('ُتم تسجيل خروجك تلقائيا نظرا لإنتهاء المده', 401);

const handleMemberIsNotInVoiceError = (err) =>
  new AppError(
    'لا يمكنك تحريك هذا الشخص من الغرفه الصوتيه نظرا لأنه ليس موجود بغرفه صوتيه بالأصل',
    400
  );

const handleCouldntFindFileError = (err) =>
  new AppError('لم نتمكن من إيجاد الملف', 404);

const sendDevError = (err, res, req) => {
  if (req.path.startsWith('/api'))
    res.status(err.statusCode).json({
      status: err.status,
      err,
      message: err.message,
      stack: err.stack,
    });
  else
    res
      .status(err.statusCode)
      .render('pages/error.pug', { title: 'حدث خطأ', err });
};

const sendProdError = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error(`Error occured`);
    console.error(err);
    res.status(500).json({
      status: 'error',
      message: 'حدث خطأ في هذه العمليه',
    });
  }
};

const errorController = function (err, req, res, next) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  const nodeEnv = process.env.NODE_ENV;

  if (nodeEnv === 'development') {
    sendDevError(err, res, req);
  } else if (nodeEnv === 'production') {
    let error = err;

    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.name === 'ValidationError') error = handleVaildationErrorDB(err);
    if (err.name === 'TokenExpiredError')
      error = handleTokenExpiredErrorDB(err);
    if (err.name === 'JsonWebTokenError')
      error = handleJsonWebTokenErrorDB(err);
    if (err.code === 11000) error = handleDuplicateErrorDB(err);
    if (err.code === 40032) error = handleMemberIsNotInVoiceError(err);
    if (err.errno === -4058) error = handleCouldntFindFileError(err);

    sendProdError(error, res, req);
  }
};

module.exports = errorController;

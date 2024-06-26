const catchAsync = require('../utils/catchAsync.js');
const User = require('../models/userModel.js');
const Task = require('../models/taskModel.js');

exports.getHome = catchAsync(async (req, res, next) => {
  res.status(200).render('pages/landing.pug', {
    title: 'الصفحه الرئيسيه',
    user: req.user,
  });
});

exports.getSignup = catchAsync(async (req, res, next) => {
  res.status(200).render('pages/signup.pug', {
    title: 'إنشاء حساب',
  });
});

exports.getLogin = catchAsync(async (req, res, next) => {
  res.status(200).render('pages/login.pug', {
    title: 'تسجيل الدخول',
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  // Getting the surahs of the quran
  const surahResponse = await fetch(`${process.env.QURAN_API}/surah`);
  if (!surahResponse.ok)
    return next(new AppError('لم نتمكن من إيجاد سور القرآن الكريم', 500));
  const surahBody = await surahResponse.json();

  let tasks;

  if (!req.user.roles.includes('admin')) {
    tasks = await Task.find({
      status: { $ne: 'done', $ne: 'canceled' },
      assignedTo: { $in: [req.user._id] },
    });
  } else tasks = await Task.find({ status: { $ne: 'done', $ne: 'canceled' } });

  res.status(200).render('pages/me.pug', {
    title: 'حسابي',
    user: req.user,
    surahs: surahBody,
    tasks,
  });
});

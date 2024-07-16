const catchAsync = require('../utils/catchAsync.js');
const User = require('../models/userModel.js');
const Task = require('../models/taskModel.js');
const PublicWird = require('../models/publicWirdModel.js');
const AppError = require('../utils/appError.js');

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

  let wirds = await PublicWird.find();

  wirds = wirds.filter((wird) =>
    wird.subscribers.find(
      (sub) => sub.user._id.toString() === req.user._id.toString()
    )
  );

  res.status(200).render('pages/me.pug', {
    title: 'حسابي',
    user: req.user,
    surahs: surahBody,
    tasks,
    userPublicWirds: wirds,
  });
});

exports.getMyHifz = catchAsync(async (req, res, next) => {
  const user = req.user;
  const surah = user.hifzProgress.find(
    (surah) => surah.surah === +req.params.surah
  );

  if (!surah) return next(new AppError('هذا الحفظ غير موجود'));

  surah.verses = surah.verses.sort((a, b) => a > b);

  const surahResponse = await fetch(`${process.env.QURAN_API}/surah`);
  if (!surahResponse.ok)
    return next(new AppError('لم نتمكن من إيجاد سور القرآن الكريم', 500));
  const surahBody = await surahResponse.json();

  const fullSurah = surahBody.data.find(
    (fullSurah) => fullSurah.number === surah.surah
  );

  surah.name = fullSurah.name;
  surah.fullSurah = fullSurah;

  res.status(200).render('pages/hifzDetails.pug', {
    title: `حفظ ${surah.name}`,
    surah,
    user: req.user,
  });
});

exports.getPublicWird = catchAsync(async (req, res, next) => {
  const wird = await PublicWird.findById(req.params.id).populate('owner');

  if (!wird) return next(new AppError('هذا الورد غير موجود', 404));
  if (
    wird.restricted &&
    !wird.restrictedTo.find(
      (user) => user._id.toString() === req.user._id.toString()
    )
  )
    return next(new AppError('لا تملك صلاحية الدخول لهذا الورد', 403));

  res.status(200).render('pages/publicWird.pug', {
    title: `ورد ${wird.owner.name} العام`,
    wird,
    user: req.user,
  });
});

exports.getPublicWirds = catchAsync(async (req, res, next) => {
  const publicWirds = await PublicWird.find({ restricted: false }).limit(10);

  res.status(200).render('pages/publicWirds.pug', {
    user: req.user,
    wirds: publicWirds,
  });
});

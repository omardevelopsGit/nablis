const User = require('../models/userModel.js');
const AppError = require('../utils/appError.js');
const catchAsync = require('../utils/catchAsync.js');

exports.addToProgress = catchAsync(async (req, res, next) => {
  const user = req.user;

  if (!req.body.surah || !req.body.verses || req.body.verses.length < 1)
    return next(new AppError('Missing surah or verses', 400));

  // Check if the desired surah exists or not, if not, add it
  const surahExists =
    user.hifzProgress
      .map((surah) => {
        if (surah.surah === req.body.surah) return true;
        else return false;
      })
      .filter((exists) => exists).length > 0;

  if (!surahExists)
    user.hifzProgress.push({ surah: req.body.surah, verses: req.body.verses });
  else
    user.hifzProgress.map((surah) => {
      if (surah.surah === req.body.surah) {
        const verses = new Set([...req.body.verses, ...surah.verses]); // To avoid multiple verses in the same surah validation error
        surah.verses = verses;
      }
      return surah;
    });

  await user.save();

  res
    .status(200)
    .json({ status: 'success', data: { hifzProgress: user.hifzProgress } });
});

exports.getHifz = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: {
      hifzProgress: req.user.hifzProgress,
    },
  });
});

exports.verifiyHifz = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ username: req.params.user.trim() });
  if (!user) return next(new AppError('هذا الحساب غير موجود', 404));

  if (!user.hifzProgress.find((surah) => surah.surah === +req.params.surah))
    return next(new AppError('هذه السوره غير موجوده بحفظ هذا المستخدم', 404));

  user.hifzProgress.map((surah) => {
    if (surah.surah === +req.params.surah) {
      if (surah.mohaffizVerified)
        return next(new AppError('هذه السوره موثقه من قبل', 400));
      surah.mohaffizVerified = true;
    }
    return surah;
  });

  await user.save();

  res.status(200).json({
    status: 'success',
    data: {
      hifzProgress: user.hifzProgress,
    },
  });
});

// ربنا آتنا من لدنك رحمة وهيء لنا من أمرنا رشدا

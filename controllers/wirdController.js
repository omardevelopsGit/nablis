const User = require('../models/userModel.js');
const Wird = require('../models/wirdModel.js');
const AppError = require('../utils/appError.js');
const catchAsync = require('../utils/catchAsync.js');

exports.saveWird = catchAsync(async (req, res, next) => {
  const wird = await Wird.findOne({ _id: req.params.id, user: req.user._id });

  if (!wird)
    return next(
      new AppError('There are no wirds with this ID in this user', 404)
    );

  wird.page = req.body.page;
  wird.verse = req.body.verse;
  await wird.save();

  res.status(200).json({
    status: 'success',
    data: {
      wird,
    },
  });
});

exports.createWird = catchAsync(async (req, res, next) => {
  // Create wird
  const wird = await Wird.create({
    name: req.body.name,
    page: req.body.page,
    verse: req.body.verse,
    user: req.user._id,
  });

  // Push wird into user
  req.user.wirds.push(wird);
  await req.user.save();

  // Response
  res.status(201).json({
    status: 'success',
    data: {
      wird,
    },
  });
});

exports.deleteWird = catchAsync(async (req, res, next) => {
  const wird = await Wird.findOne({ _id: req.params.id, user: req.user._id });
  const user = await User.findById(req.user._id);
  user.wirds = user.wirds.filter((wird) => {
    return wird.toString() !== req.params.id.toString();
  });
  await user.save();

  if (!wird) return next(new AppError('This wird was not found', 404));

  await wird.deleteOne();

  res.status(204).end();
});

exports.getWird = catchAsync(async (req, res, next) => {
  const wird = await Wird.findOne({ _id: req.params.id, user: req.user._id });

  if (!wird) return next(new AppError('Wird was not found', 404));

  res.status(200).json({
    status: 'success',
    data: {
      wird,
    },
  });
});

exports.getMyWirds = catchAsync(async (req, res, next) => {
  const wirds = await Wird.find({ user: req.user._id });

  res.status(200).json({
    status: 'success',
    data: {
      wirds,
    },
  });
});

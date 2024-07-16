const AppError = require('../utils/appError.js');
const catchAsync = require('../utils/catchAsync.js');
const User = require('../models/userModel.js');
const { default: mongoose } = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

const createSendToken = (res, user, statusCode) => {
  // Sign a jwt
  const token = jwt.sign({ id: user._id }, process.env.JWT_SEC, {
    expiresIn: process.env.JWT_EXP,
  });

  // Create some cookie
  res.cookie('jwt', token, {
    maxAge: process.env.JWT_EXP,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'development' ? false : true,
  });

  user.password = undefined;
  user.passwordConfirm = undefined;
  user.active = undefined;
  user.role = undefined;

  // Send Resposne
  res.status(statusCode).json({
    status: 'success',
    data: { user },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const user = await User.create({
    name: req.body.name,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    username: req.body.username,
    wirds: [],
    hifzProgress: [
      {
        surah: 1,
        verses: [1, 2, 3, 4, 5, 6, 7],
        mohaffizVerified: true,
      },
    ],
    roles: ['user'],
  });

  createSendToken(res, user, 201);
});

exports.login = catchAsync(async (req, res, next) => {
  if (!req.body.password || !req.body.username)
    return next(new AppError('Please provide username and password', 400));

  const user = await User.findOne({ username: req.body.username }).select(
    '+password'
  );

  if (!user || !(await bcrypt.compare(req.body.password, user.password)))
    return next(new AppError('تم ادخال بيانات خاطئه', 401));

  createSendToken(res, user, 200);
});

exports.editMe = catchAsync(async (req, res, next) => {
  // Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'username');

  // Update User
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  // Response
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.editPassword = catchAsync(async (req, res, next) => {
  if (!req.body.password || !req.body.username)
    return next(new AppError('Please provide username and password', 400));

  const user = await User.findOne({ username: req.body.username }).select(
    '+password'
  );

  if (!user || !(await bcrypt.compare(req.body.password, user.password)))
    return next(new AppError('تم ادخال بيانات خاطئه', 401));

  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();

  createSendToken(res, user, 200);
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  if (!req.body.password || !req.body.username)
    return next(new AppError('Please provide username and password', 400));

  const user = await User.findOne({ username: req.body.username }).select(
    '+password'
  );

  if (!user || !(await bcrypt.compare(req.body.password, user.password)))
    return next(new AppError('تم ادخال بيانات خاطئه', 401));

  await user.updateOne({ active: false });

  res.status(204).end();
});

exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id); // did this because req.user haves some sensitive info
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  const token = req.cookies.jwt;

  if (!token) {
    return next(
      new AppError(
        'أنت لست مسجل داخل هذا الموقع، يرجى تسجيل الدخول للحصول على صلاحية الدخول لهذه الخدمه',
        401
      )
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SEC);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('هذا الحساب محذوف او غير موجود.', 401));
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'تم تغيير كلمة سر هذا الحساب بعد أن تم تسجيل دخولك هنا، يرجى تسجيل الدخول مره اخره بكلمة السر الجديده',
        401
      )
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

exports.optionalProtect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  const token = req.cookies.jwt;

  if (!token) {
    req.user = undefined;
    return next();
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SEC);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    req.user = undefined;
    return next();
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    req.user = undefined;
    return next();
  }

  // Save user
  req.user = currentUser;
  next();
});

exports.restrict = (...roles) => {
  return (req, res, next) => {
    const includes = roles.reduce(
      (acc, role) => acc || req.user.roles.includes(role),
      false
    );
    if (!includes)
      return next(new AppError('أنت لا تملك الصلاحية الوصول لهنا', 403));

    next();
  };
};

exports.logout = (req, res, next) => {
  res.cookie('jwt', '', {
    maxAge: process.env.JWT_EXP,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'development' ? false : true,
  });

  res.status(204).end();
};

exports.addRoles = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ username: req.params.username });

  if (!user) return next(new AppError('هذا المستخدم غير موجود', 404));

  const roles = new Set([...req.body.roles, ...user.roles]);
  user.roles = Array.from(roles);
  await user.save();

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

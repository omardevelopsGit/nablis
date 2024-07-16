const User = require('../models/userModel.js');
const Wird = require('../models/wirdModel.js');
const PublicWird = require('../models/publicWirdModel.js');
const AppError = require('../utils/appError.js');
const APIFeatures = require('../utils/apiFeatures.js');
const catchAsync = require('../utils/catchAsync.js');

exports.saveWird = catchAsync(async (req, res, next) => {
  const wird = await Wird.findOne({ _id: req.params.id, user: req.user._id });
  const publicWird = await PublicWird.findById(req.params.id);

  if (wird) {
    wird.page = req.body.page;
    wird.verse = req.body.verse;
    await wird.save();

    res.status(200).json({
      status: 'success',
      data: {
        wird,
      },
    });
  } else if (publicWird) {
    if (
      !publicWird.subscribers.find(
        (sub) => sub.user._id.toString() === req.user._id.toString()
      )
    )
      return next(new AppError('أنت لا تملك الصلاحيه لرؤية هذا الورد', 403));

    publicWird.subscribers.map((sub) => {
      if (sub.user._id.toString() === req.user._id.toString()) {
        sub.progress.page = req.body.page;
        sub.progress.verse = req.body.verse;
      }
      return sub;
    });

    await publicWird.save();

    res.status(200).json({
      status: 'success',
      data: {
        wird,
      },
    });
  } else return next(new AppError('هذا الورد غير موجود', 404));
}); //

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
}); //

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
}); //

exports.getWird = catchAsync(async (req, res, next) => {
  const wird = await Wird.findOne({ _id: req.params.id, user: req.user._id });

  if (!wird) return next(new AppError('Wird was not found', 404));

  res.status(200).json({
    status: 'success',
    data: {
      wird,
    },
  });
}); //

exports.getMyWirds = catchAsync(async (req, res, next) => {
  const wirds = await Wird.find({ user: req.user._id });

  res.status(200).json({
    status: 'success',
    data: {
      wirds,
    },
  });
}); //

exports.createPublicWird = catchAsync(async (req, res, next) => {
  if (
    (req.body.restrictedTo && !req.body.restricted) ||
    (!req.body.restrictedTo && req.body.restricted)
  )
    return next(
      new AppError(
        'If you want to create restricted public wird, then restricted must be true, and restrictedTo must be an array',
        400
      )
    );

  const wird = (
    await PublicWird.create({
      name: req.body.name,
      dailyProgress: req.body.dailyProgress,
      description: req.body.description,
      owner: req.user._id,
      restricted: req.body.restricted ? true : false,
      restrictedTo: req.body.restricted ? req.body.restrictedTo : [],
      subscribers: [],
      uniqueName: req.body.uniqueName,
      maxMembers: req.body.maxMembers,
      subscribers: [
        {
          progress: { page: 1, verse: 1 },
          user: req.user,
          joinedAt: Date.now(),
        },
      ],
    })
  ).toObject();

  res.status(201).json({
    status: 'success',
    data: {
      wird,
    },
  });
});

exports.joinPublicWird = catchAsync(async (req, res, next) => {
  let wird = await PublicWird.findOne({ uniqueName: req.params.id });

  if (!wird) return next(new AppError('هذا الورد غير موجود', 404));

  if (
    wird.restricted &&
    !wird.restrictedTo.find(
      (user) => user._id.toString() === req.user._id.toString()
    )
  )
    return next(new AppError('هذا ورد خاص، وأنت غير مدعو للدخول إليه', 403));

  if (
    wird.subscribers.find(
      (sub) => sub.user._id.toString() === req.user._id.toString()
    )
  )
    return next(new AppError('انت موجود بهذا الورد من الأساس', 403));

  const maxMembersReached =
    wird.maxMembers === 0
      ? false
      : wird.maxMembers > wird.subscribers.length
      ? false
      : true;

  if (wird.closedNewMembers || maxMembersReached)
    return next(
      new AppError(
        'للأسف، لقد تأخرت، هذا الورد لا يستقبل أي أعضاء جدد، إما أن المالك قد وقف الاستقبال، أو لقد وصل الحد الأقصى للأعضاء',
        403
      )
    );

  wird.subscribers.push({
    progress: {
      page: 1,
      verse: 1,
    },
    user: req.user,
  });

  await wird.save();
  wird = await PublicWird.findById(wird._id);

  res.status(200).json({
    status: 'success',
    data: {
      wird,
    },
  });
});

exports.getPublicWird = catchAsync(async (req, res, next) => {
  const wird = await PublicWird.findById(req.params.id);

  if (!wird) return next(new AppError('هذا الورد غير موجود', 404));
  if (
    wird.restricted &&
    !wird.restrictedTo.find(
      (user) => user._id.toString() === req.user._id.toString()
    )
  )
    return next(new AppError('انت لا تملك الصلاحيه لرؤية  هذا الورد', 403));

  res.status(200).json({
    status: 'success',
    data: {
      wird,
    },
  });
});

exports.getPublicWirds = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(PublicWird.find(), req.query)
    .limitFields()
    .paginate();

  const wirds = await features.query;

  res.status(200).json({
    status: 'success',
    data: {
      wirds,
    },
  });
});

exports.deletePublicWirds = catchAsync(async (req, res, next) => {
  const wird = await PublicWird.findOne({ uniqueName: req.params.id });

  if (!wird || wird.owner._id.toString() !== req.user._id.toString())
    return next(new AppError('هذا الورد غير موجود', 404));

  wird.deleted = true;
  await wird.save();

  res.status(204).end();
});

exports.toggleSubsToAPublicWird = catchAsync(async (req, res, next) => {
  const wird = await PublicWird.findById(req.params.id);

  if (!wird || wird.owner._id.toString() !== req.user._id.toString())
    return next(new AppError('هذا الورد غير موجود', 404));

  wird.closedNewMembers = !wird.closedNewMembers;
  await wird.save();

  res.status(200).json({
    status: 'success',
    data: {
      wird,
    },
  });
});

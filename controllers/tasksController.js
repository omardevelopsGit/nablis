const Task = require('../models/taskModel.js');
const User = require('../models/userModel.js');
const AppError = require('../utils/appError.js');
const catchAsync = require('../utils/catchAsync.js');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.createTask = catchAsync(async (req, res, next) => {
  // Specialized for tasks-manager & admin
  // assignedTo is provided as usernames, and here, converting assignedTo into usernames
  const promises = req.body.assignedTo.map(async (username) => {
    const user = await User.findOne({ username }).select('_id');
    if (!user)
      return next(
        new AppError(`إسم المستخدم التالي غير موجود: ${username}`, 404)
      );
    return user._id.toString();
  });
  req.body.assignedTo = await Promise.all(promises);
  if (req.body.assignedTo.includes(undefined)) return;

  // Create a task
  const task = await Task.create({
    title: req.body.title,
    description: req.body.description,
    assignedTo: req.body.assignedTo,
  });

  // Response
  res.status(201).json({
    status: 'success',
    data: {
      task,
    },
  });
}); //

exports.editTask = catchAsync(async (req, res, next) => {
  // filter body
  const filteredBody = filterObj(req.body, 'title', 'description');

  // ربنا أخرجنا منها فإن عدنا فإنا ظالمين
  // Update task
  const task = await Task.findByIdAndUpdate(req.params.id, filteredBody, {
    new: true,
  });
  if (!task) return next(new AppError('Incorrect task ID', 404));

  // ألم تكن آياتي تتلى عليكم فكنتم بها تكذبون
  // Response
  res.status(200).json({
    status: 'success',
    data: {
      task,
    },
  });
}); //

exports.addMeToTask = catchAsync(async (req, res, next) => {
  // Check worker access to this task & fetch task
  const task = await Task.findById(req.params.id);

  if (task.status === 'done')
    return next(new AppError('هذه المهمه منتهيه بالأصل', 403));

  const workerIndex = task?.assignedTo?.findIndex(
    (user) => user._id.toString() === req.user._id.toString()
  );
  if ((workerIndex && workerIndex < 0) || !task)
    return next(
      new AppError('لم نتمكن من إيجاد هذه المهمه، وقد تكون المهمه ليست لك', 404)
    );

  // The worker can assign himself to be working, check if the worker is already in the task
  if (
    task.workers.filter(
      (w) => w.user._id.toString() === req.user._id.toString() && !w.doneWork
    ).length > 0
  )
    return next(new AppError('أنت بالفعل مسجل بهذه المهمه', 400));

  if (
    task.workers.find(
      (worker) => worker.user.toString() === req.user._id.toString()
    )
  ) {
    task.workers.map((worker) => {
      if (worker.user.toString() == req.user._id.toString())
        worker.doneWork = false;
      return worker;
    });
  } else
    task.workers.push({
      user: req.user._id,
    });

  await task.save();

  // Respond
  res.status(200).json({
    status: 'success',
    data: {
      task,
    },
  });
}); //

exports.removeMeFromTask = catchAsync(async (req, res, next) => {
  // Check worker access to this task & fetch task
  const task = await Task.findById(req.params.id);

  if (task.status === 'done')
    return next(new AppError('هذه المهمه منتهيه بالأصل', 403));

  // Check if the user works in this task
  if (
    task.workers.filter(
      (w) => w.user._id.toString() === req.user._id.toString() && !w.doneWork
    ).length < 1
  )
    return next(new AppError('أنت لست موجود في هذه المهمه بالأصل', 403));

  // Remove the user from worker list
  task.workers = task.workers.filter(
    (w) => w.user._id.toString() !== req.user._id.toString()
  );

  await task.save();

  // Response
  res.status(200).json({
    status: 'success',
    data: {
      task,
    },
  });
}); //

exports.doneMyWork = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) return next(new AppError('هذه المهمه غير موجوده أو محذوفه', 404));

  const workerIndex = task.workers.findIndex(
    (user) => user.user._id.toString() === req.user._id.toString()
  );

  if (workerIndex < 0)
    return next(new AppError('أنت لا تملك الصلاحيه للوصول لهذه المهمه', 403));

  task.workers[workerIndex].doneWork = true;

  await task.save();

  res.status(200).json({
    status: 'success',
    data: {
      task,
    },
  });
}); //

exports.cancelTask = catchAsync(async (req, res, next) => {
  const cancelledTask = await Task.findByIdAndUpdate(
    req.params.id,
    {
      canceled: true,
    },
    { new: true }
  );

  if (!cancelledTask)
    return next(new AppError('هذه المهمه محذوفه بالأصل، أو غير موجوده', 404));

  res.status(204).end();
}); //

exports.getAllTask = catchAsync(async (req, res, next) => {
  const tasks = await Task.find();

  res.status(200).json({
    status: 'success',
    data: {
      tasks,
    },
  });
}); //

exports.getTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) return next(new AppError('هذه المهمه غير موجوده أو محذوفه', 404));
  if (
    !['admin', 'tasks-manager'].includes(req.user.role) &&
    task.assignedTo.filter((w) => w._id.toString() === req.user._id.toString())
      .length < 1
  )
    return next(new AppError('انت لا تملك الصلاحيه للوصول لهذه المهمه'));

  res.status(200).json({
    status: 'success',
    data: {
      task,
    },
  });
}); //

exports.getMyTask = catchAsync(async (req, res, next) => {
  const tasks = await Task.find({
    assignedTo: { $in: [req.user._id] },
  });

  res.status(200).json({
    status: 'success',
    data: {
      tasks,
    },
  });
}); //

exports.markTaskAsDone = catchAsync(async (req, res, next) => {
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { status: 'done' },
    { new: true }
  );

  if (!task) return next(new AppError('لم نتمكن من إيجاد هذه المهمه', 404));

  res.status(200).json({
    status: 'success',
    data: { task },
  });
}); //

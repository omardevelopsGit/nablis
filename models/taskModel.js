const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a task title'],
  },
  description: {
    type: String,
    required: [true, 'Please provide description'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  assignedTo: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [
        true,
        'Please provide the user ID who is wanted to be assigned to this task',
      ],
    },
  ],
  status: {
    type: String,
    enum: ['assigned', 'in-progress', 'done'],
    default: 'assigned',
  },
  workers: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
      doneWork: {
        type: Boolean,
        default: false,
      },
    },
  ],
  finishedAt: Date,
  canceled: {
    type: Boolean,
    default: false,
  },
});

taskSchema.pre('save', function (next) {
  if (!this.isModified('workers')) return next();

  if (
    this.workers.length > 0 &&
    this.workers.filter((w) => !w.doneWork).length > 0 &&
    this.status !== 'done'
  )
    this.status = 'in-progress';
  else if (
    (this.workers.length < 1 ||
      this.workers.filter((w) => !w.doneWork).length < 1) &&
    this.status !== 'done'
  )
    this.status = 'assigned';

  next();
});

taskSchema.pre(/^find/, function (next) {
  this.find({ canceled: { $ne: true } });
  this.populate({
    path: 'assignedTo',
    select: 'name _id username',
  });

  next();
});

taskSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'done')
    this.finishedAt = Date.now();

  next();
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;

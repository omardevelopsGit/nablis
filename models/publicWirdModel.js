const mongoose = require('mongoose');

const publicWirdSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'يرجى إرفاق إسم ورد'],
  },
  uniqueName: {
    type: String,
    required: [true, 'يرجى إرفاق إسم خاص للورد'],
    unique: true,
  },
  description: {
    type: String,
    required: [true, 'يرجى إرفاق وصف'],
  },
  subscribers: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
      progress: {
        page: {
          type: Number,
          min: 1,
          max: 604, // There are 604 pages in the Holy Quran
          required: [true, 'يرجى إرفاق رقم الصفحه'],
        },
        verse: {
          type: Number,
          validate: {
            validator: async function (v) {
              const quranResponse = await fetch(
                `${process.env.QURAN_API}/page/${this.page}/ar.asad`
              );

              if (!quranResponse.ok) return true; // Avoid errors
              const quranBody = await quranResponse.json();

              return quranBody.data.ayahs.length >= v;
            },
            message: 'هذه الآيه غير موجوده في الصفحه',
          },

          required: [true, 'يرجى إرفاق رقم الآيه'],
        },
      },
    },
  ],
  dailyProgress: {
    type: Number,
    required: [true, 'يرجى إرفاق مقدار الصفحات الواجب قرائتها في اليوم الواحد'],
  },
  restricted: {
    type: Boolean,
    defualt: false,
  },
  restrictedTo: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  ],
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  done: {
    type: Boolean,
    default: false,
  },
  closedNewMembers: {
    type: Boolean,
    default: false,
  },
  maxMembers: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

publicWirdSchema.pre(/^find/, function (next) {
  this.find({ done: false, deleted: false });
  next();
});

publicWirdSchema.pre(/^find/, function (next) {
  this.populate('subscribers.user');

  next();
});

const PublicWird = mongoose.model('PublicWird', publicWirdSchema);

module.exports = PublicWird;

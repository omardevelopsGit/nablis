const mongoose = require('mongoose');

const wirdSchema = new mongoose.Schema({
  lastSave: {
    type: Date,
    default: Date.now,
  },
  page: {
    type: Number,
    min: 1,
    max: 604, // There are 604 pages in the Holy Quran
    required: [true, 'Please provide wird page'],
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
      message: 'This verse is not in this page',
    },

    required: [true, 'Please provide wird verse'],
  },
  name: {
    type: String,
    required: [true, 'Please provide wird name'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Please provide user'],
  },
  ended: {
    type: Boolean,
    default: false,
  },
});

wirdSchema.pre('save', function (next) {
  if (this.isNew) return next();
  this.lastSave = Date.now();

  next();
});

wirdSchema.pre('save', function (next) {
  if (this.verse === 114 && this.page == 604) this.ended = true;

  next();
});

const Wird = mongoose.model('Wird', wirdSchema);

module.exports = Wird;

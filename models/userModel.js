const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
  },
  username: {
    type: String,
    required: [true, 'يرجى تزويد إسم مستخدم'],
    unique: true,
    validate: {
      validator(value) {
        const illegals = [
          '/',
          '*',
          ' ',
          '?',
          '(',
          ')',
          '{',
          '}',
          '|',
          '\\',
          '^',
          '~',
          '[',
          ']',
          '`',
        ];

        const includesIllegal = Array.from(value).reduce((acc, ch) => {
          return acc && !illegals.includes(ch);
        }, true);

        return includesIllegal;
      },
      message:
        'إسم هذا المستخدم يحتوي على حروف غير مدعومه مثل الفراع أو / أو * أو ^.',
    },
  },
  password: {
    type: String,
    required: [true, 'يرجى إدخال كلمة سر'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'يرجى تأكيد كلمة السر'],
    select: false,
  },
  wirds: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Wird', // ورد قرئاني
    },
  ],
  hifzProgress: [
    {
      surah: {
        type: Number,
        min: 1,
        max: 114,
      },
      verses: [
        {
          type: Number,
          validate: {
            validator: async function (v) {
              const surahResponse = await fetch(
                `${process.env.QURAN_API}/surah/${this.surah}`
              );
              if (!surahResponse.ok) return true; // To avoid errors
              const surahBody = await surahResponse.json();

              if (v * 1 < 1) return false;
              return surahBody.data.ayahs.length >= v * 1;
            }, // قل عسى أن يكون قريبا
            message: 'يرجى تزويد رقم آيه صحيح، لأنه غير موجود بهذه السوره',
          },
        },
      ],
      mohaffizVerified: { type: Boolean, default: false },
    },
  ],
  memorizedQuran: {
    type: Boolean,
    default: false,
  },
  roles: [
    {
      type: String,
      enum: ['user', 'admin', 'tasks-manager', 'mohaffiz', 'worker'],
    },
  ],
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  passwordChangedAt: Date,
  createdAt: {
    default: Date.now,
    type: Date,
  },
});

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();
  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }
  // وأنه تعالى جد ربنا ماتخذ صاحبةً ولا ولدًا
  // False means NOT changed
  return false;
};

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  this.populate('wirds');

  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;

require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');
const mongoSan = require('express-mongo-sanitize');
const errorController = require('./controllers/errorController.js');
const userRouter = require('./routers/userRouter.js');
const AppError = require('./utils/appError.js');
const cookiesParser = require('cookie-parser');
const path = require('path');
const crypto = require('crypto');
const wirdRouter = require('./routers/wirdRouter.js');
const tasksRouter = require('./routers/tasksRouter.js');
const viewsRouter = require('./routers/viewsRouter.js');
const pugRouter = require('./routers/pugRouter.js');
const authController = require('./controllers/authController.js');
const xss = require('xss-clean');
const catchAsync = require('./utils/catchAsync.js');

const app = express();

// View Engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Middlewares & Security
// Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", 'js.stripe.com'],
        scriptSrc: [
          "'self'",
          'unpkg.com',
          'cdn.jsdelivr.net',
          '*.squarecdn.com',
          'js.squareupsandbox.com',
        ],
        scriptSrcElem: ['unpkg.com', "'self'"],
        connectSrc: ["'self'", 'unpkg.com', 'pci-connect.squareupsandbox.com'],
        imgSrc: ["'self'", 'unpkg.com'],
        // Add other directives as needed
      },
    },
  })
);

// Rate limit
const limiter = rateLimit({
  max: 150,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests',
});

app.use('/api/v1', limiter);

// Parameter pollution exception
app.use(hpp());

// Body parser
app.use(express.json({ limit: '10kb' }));

// Cookies parser
app.use(cookiesParser());

// logger
// app.use((req, res, next) => {
//   if (process.env.NODE_ENV !== 'development') return next();

//   console.log('New request');
//   console.log(
//     `Host: ${req.headers.host}\nOriginal URL: ${req.originalUrl}\nBase URL: ${
//       req.baseUrl
//     }\nIP address: ${req.ip}\nCookies: ${JSON.stringify(req.cookies)}`
//   );

//   next();
// });

// Sanitize body

// Xss attacks
app.use(xss());

// NoSQL query injection
app.use(mongoSan());

// Routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/wirds', authController.protect, wirdRouter);
app.use('/api/v1/tasks', authController.protect, tasksRouter);
app.use('/api/v1/pugify', pugRouter);

// Serving static files in public
app.use(express.static(path.join(__dirname, '/public')));

// Views
app.use('/', authController.optionalProtect, viewsRouter);

// Global Error Handlers
app.all('*', (req, res, next) => {
  next(
    new AppError('هذا الراوت غير موجود بالسيرفر، تم إعطائك رابط خاطئ.', 404)
  );
});

// Global error handler
app.use(errorController);

if (process.env.NODE_ENV !== 'dev')
  setInterval(async () => {
    await fetch(process.env.LIVE_API);
  }, 1000 * 60 * 3);

module.exports = app;

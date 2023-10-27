require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');
const mongoSan = require('express-mongo-sanitize');
const errorController = require('./controllers/errorController.js');
const router = require('./routers/router.js');
const AppError = require('./utils/appError.js');
const cookiesParser = require('cookie-parser');

const app = express();

// Middlewares & Security
// Helmet
app.use(helmet());

// Rate limit
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests',
});

app.use(limiter);

// Parameter pollution exception
app.use(hpp());

// Body parser
app.use(express.json({ limit: '10kb' }));

// Cookies parser
app.use(cookiesParser());

// logger
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'development') return next();

  console.log('New request');
  console.log(
    `Host: ${req.headers.host}\nOriginal URL: ${req.originalUrl}\nBase URL: ${
      req.baseUrl
    }\nIP address: ${req.ip}\nCookies: ${JSON.stringify(req.cookies)}`
  );

  next();
});

// Sanitize body

// Xss attacks
app.use((req, res, next) => {
  const nonce = crypto.randomBytes(64).toString('hex');
  const header = `default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'nonce-${nonce}';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests`;

  res.set('Content-Security-Policy', header);

  res.Nonce = nonce;
  next();
});

// NoSQL query injection
app.use(mongoSan());

// Routes
app.use('/api/v1/', router);

// Global Error Handlers
app.all('*', (req, res, next) => {
  next(new AppError('This route is not defined on this server', 404));
});

// Global error handler
app.use(errorController);

module.exports = app;

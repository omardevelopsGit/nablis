const express = require('express');
const authController = require('../controllers/authController.js');
const hifzController = require('../controllers/hifzController.js');
const meRouter = require('./nested/userMeRouter.js');

const router = express.Router();

router.use('/me', authController.protect, meRouter);

router.route('/signup').post(authController.signup);
router.route('/login').post(authController.login);
router.route('/logout').post(authController.protect, authController.logout);
router
  .route('/:username/roles')
  .post(authController.protect, authController.addRoles);

router
  .route('/hifz/:user/:surah')
  .put(
    authController.protect,
    authController.restrict('admin', 'mohaffiz'),
    hifzController.verifiyHifz
  );

module.exports = router;

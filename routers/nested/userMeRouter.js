const express = require('express');
const authController = require('../../controllers/authController.js');
const hifzController = require('../../controllers/hifzController.js');

const router = express.Router();

router
  .route('/')
  .get(authController.getMe)
  .put(authController.editMe)
  .delete(authController.deleteMe);

router.route('/password').put(authController.editPassword);

router.route('/hifz').put(hifzController.addToProgress).get(hifzController.getHifz);

module.exports = router;

const express = require('express');
const viewsController = require('../controllers/viewsController.js');
const authController = require('../controllers/authController.js');

const router = express.Router();

router.get('/', viewsController.getHome);
router.get('/signup', viewsController.getSignup);
router.get('/login', viewsController.getLogin);
router.get('/me', authController.protect, viewsController.getMe);
router.get(
  '/me/hifz/:surah',
  authController.protect,
  viewsController.getMyHifz
);
router.get(
  '/wirds/public',
  authController.protect,
  viewsController.getPublicWirds
);
router.get(
  '/wirds/public/:id',
  authController.protect,
  viewsController.getPublicWird
);

module.exports = router;

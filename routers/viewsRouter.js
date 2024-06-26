const express = require('express');
const viewsController = require('../controllers/viewsController.js');
const authController = require('../controllers/authController.js');

const router = express.Router();

router.get('/', viewsController.getHome);
router.get('/signup', viewsController.getSignup);
router.get('/login', viewsController.getLogin);
router.get('/me', authController.protect, viewsController.getMe);

module.exports = router;

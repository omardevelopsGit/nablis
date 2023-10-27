const express = require('express');
const controller = require('../controllers/contoller.js');

const router = express.Router();

router.route('/').all(controller.handler);
module.exports = router;

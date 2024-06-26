const express = require('express');
const pugController = require('../controllers/pugController.js');

const router = express.Router();

router.post('/:template', pugController.pugify);

module.exports = router;

const express = require('express');
const wirdController = require('../controllers/wirdController.js');

const router = express.Router();

router
  .route('/')
  .post(wirdController.createWird)
  .get(wirdController.getMyWirds);

router
  .route('/:id')
  .get(wirdController.getWird)
  .put(wirdController.saveWird)
  .delete(wirdController.deleteWird);

module.exports = router;

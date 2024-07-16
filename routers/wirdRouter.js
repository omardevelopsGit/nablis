const express = require('express');
const wirdController = require('../controllers/wirdController.js');

const router = express.Router();

router
  .route('/')
  .post(wirdController.createWird)
  .get(wirdController.getMyWirds);

router
  .route('/public')
  .get(wirdController.getPublicWirds)
  .post(wirdController.createPublicWird);

router
  .route('/public/:id')
  .get(wirdController.getPublicWird)
  .delete(wirdController.deletePublicWirds)
  .put(wirdController.toggleSubsToAPublicWird)
  .post(wirdController.joinPublicWird);

router
  .route('/:id')
  .get(wirdController.getWird)
  .put(wirdController.saveWird)
  .delete(wirdController.deleteWird);

module.exports = router;

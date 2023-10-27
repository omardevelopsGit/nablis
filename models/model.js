const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
  },
});

const Model = mongoose.model('Model', schema);

module.exports = Model;

const mongoose = require('mongoose');

const schema = mongoose.Schema({
  userA: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  userB: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
});

module.exports = mongoose.model('connections', schema);

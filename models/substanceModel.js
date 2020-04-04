const mongoose = require("mongoose");

const substanceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, `A substance must have a name`],
  },
  number: {
    type: Number,
    required: [true, `A substance must have a number`],
  },
  casNumber: {
    type: String,
    unique: true,
  },
  location: {
    type: Number,
    required: [true, `A substance must have a location`],
  },
  place: {
    type: String,
    required: [true, `A substance must have a location`],
  },
  amount: String,
  company: String
});

const Substance = mongoose.model("Substance", substanceSchema);

module.exports = Substance;

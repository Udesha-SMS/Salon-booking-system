const mongoose = require("mongoose");

const professionalSchema = new mongoose.Schema({
  name: String,
  image: String,
  role: String,
  
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon",
  },
  gender: {
    type: String,
    enum: ["Male", "Female"],
    required: true,
  },

  available: {
    type: Boolean,
    default: true,
  },
  certificate: String,
});

module.exports = mongoose.model("Professional", professionalSchema);

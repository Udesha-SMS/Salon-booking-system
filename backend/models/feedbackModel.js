const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
    required: true,
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Salon",
    required: true,
  },
  professionalId: { // ✅ new field
    type: mongoose.Schema.Types.ObjectId,
    ref: "Professional",
    default: null, // optional
  },
  userEmail: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Feedback", feedbackSchema);

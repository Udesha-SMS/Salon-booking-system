const express = require("express");
const router = express.Router();
const Feedback = require("../models/feedbackModel.js"); 
const Professional = require("../models/Professional.js");

// 📥 Submit feedback (Customer side)
router.post("/", async (req, res) => {
  try {
    const { appointmentId, salonId, professionalId, userEmail, rating, comment } = req.body;

    // ✅ Validation
    if (!appointmentId || !salonId || !userEmail || !rating) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    // ✅ Create feedback document
    const feedback = new Feedback({
      appointmentId,
      salonId,
      professionalId, // optional: attach to professional if given
      userEmail,
      rating,
      comment,
    });

    // ✅ Save to DB
    const saved = await feedback.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Error saving feedback:", err);
    res.status(500).json({ message: "Failed to submit feedback" });
  }
});

// 📄 Get all feedbacks for a salon (Owner side)
router.get("/salon/:salonId", async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ salonId: req.params.salonId })
      .sort({ createdAt: -1 }); // newest first
    res.json(feedbacks);
  } catch (err) {
    console.error("Error fetching salon feedbacks:", err);
    res.status(500).json({ message: "Failed to fetch salon feedbacks" });
  }
});

// GET: Fetch all feedbacks for a professional
// GET: Fetch all feedbacks for a professional
router.get("/professionals/:professionalId", async (req, res) => {
  try {
    const { professionalId } = req.params;

    // Find feedbacks and populate professional details
    const feedbacks = await Feedback.find({ professionalId })
      .sort({ createdAt: -1 })
      .populate("professionalId", "name image role");

    // Calculate average rating
    const averageRating = feedbacks.length
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
      : 0;

    // ✅ Return consistent structure
    res.json({
      feedbacks,
      averageRating,
    });
  } catch (err) {
    console.error("Error fetching professional feedbacks:", err);
    res.status(500).json({ message: "Failed to fetch professional feedbacks" });
  }
});





// GET: Fetch all professionals for a salon with their feedbacks
router.get("/with-feedbacks/:salonId", async (req, res) => {
  try {
    const { salonId } = req.params;

    // Fetch professionals for this salon
    const professionals = await Professional.find({ salonId }).lean(); // lean() returns plain JS objects

    // Attach feedbacks to each professional
    const professionalsWithFeedbacks = await Promise.all(
      professionals.map(async (pro) => {
        const feedbacks = await Feedback.find({ professionalId: pro._id }).sort({ createdAt: -1 });
        // Optional: calculate average rating
        const averageRating = feedbacks.length > 0
          ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
          : null;

        return { ...pro, feedbacks, averageRating };
      })
    );

    res.json(professionalsWithFeedbacks);
  } catch (err) {
    console.error("Error fetching professionals with feedbacks:", err);
    res.status(500).json({ message: "Failed to fetch professionals with feedbacks" });
  }
});


module.exports = router;

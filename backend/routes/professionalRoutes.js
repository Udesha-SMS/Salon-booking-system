const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Professional = require("../models/Professional");

// -------------------------------------------
// Multer storage (image + certificate)
// -------------------------------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder =
      file.fieldname === "certificate"
        ? "uploads/certificates"
        : "uploads/professionals";
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// -------------------------------------------
// GET: Fetch all professionals for a salon
// -------------------------------------------
router.get("/:salonId", async (req, res) => {
  try {
    const professionals = await Professional.find({
      salonId: req.params.salonId,
    });
    res.json(professionals);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch professionals" });
  }
});

// -------------------------------------------
// POST: Add new professional (image + certificate)
// -------------------------------------------
router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "certificate", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const professional = new Professional({
        name: req.body.name,
        role: req.body.role,
        salonId: req.body.salonId,
        gender: req.body.gender, // ✅ Must be included
        image: req.files?.image ? req.files.image[0].filename : undefined,
        certificate: req.files?.certificate
          ? req.files.certificate[0].filename
          : undefined,
      });

      await professional.save();
      res.status(201).json(professional);
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: "Failed to add professional" });
    }
  }
);

// -------------------------------------------
// PUT: Update professional + optional files
// -------------------------------------------
router.put(
  "/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "certificate", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const updateData = {
        name: req.body.name,
        role: req.body.role,
        gender: req.body.gender, // ✅ Must be included
      };

      if (req.files?.image)
        updateData.image = req.files.image[0].filename;

      if (req.files?.certificate)
        updateData.certificate = req.files.certificate[0].filename;

      const updated = await Professional.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: "Failed to update professional" });
    }
  }
);

// -------------------------------------------
// DELETE: Delete a professional
// -------------------------------------------
router.delete("/:id", async (req, res) => {
  try {
    await Professional.findByIdAndDelete(req.params.id);
    res.json({ message: "Professional deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete professional" });
  }
});

module.exports = router;

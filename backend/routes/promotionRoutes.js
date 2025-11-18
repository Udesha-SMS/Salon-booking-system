const express = require('express');
const router = express.Router();
const Promotion = require('../models/Promotion');

// GET: All promotions
router.get('/', async (req, res) => {
  try {
    const promotions = await Promotion.find()
      .populate('salonId', 'name')
      .sort({ createdAt: -1 });
    res.json(promotions);
  } catch (err) {
    console.error('Error fetching promotions:', err);
    res.status(500).json({ message: 'Failed to fetch promotions' });
  }
});

// GET: Promotions by salon
router.get('/salon/:salonId', async (req, res) => {
  try {
    const promotions = await Promotion.find({ salonId: req.params.salonId })
      .sort({ createdAt: -1 });
    res.json(promotions);
  } catch (err) {
    console.error('Error fetching salon promotions:', err);
    res.status(500).json({ message: 'Failed to fetch salon promotions' });
  }
});

// POST: Create promotion
router.post('/', async (req, res) => {
  try {
    const promotion = new Promotion(req.body);
    const saved = await promotion.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error creating promotion:', err);
    res.status(500).json({ message: 'Failed to create promotion' });
  }
});

// PUT: Update promotion
router.put('/:id', async (req, res) => {
  try {
    const updated = await Promotion.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.error('Error updating promotion:', err);
    res.status(500).json({ message: 'Failed to update promotion' });
  }
});

// DELETE: Delete promotion
router.delete('/:id', async (req, res) => {
  try {
    await Promotion.findByIdAndDelete(req.params.id);
    res.json({ message: 'Promotion deleted successfully' });
  } catch (err) {
    console.error('Error deleting promotion:', err);
    res.status(500).json({ message: 'Failed to delete promotion' });
  }
});

module.exports = router;
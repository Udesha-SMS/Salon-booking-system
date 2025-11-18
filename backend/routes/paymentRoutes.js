const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Salon = require('../models/Salon');

// GET: All payments with filters
router.get('/', async (req, res) => {
  try {
    const { salonId, status, startDate, endDate } = req.query;
    
    let query = {};
    
    if (salonId) query.salonId = salonId;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const payments = await Payment.find(query)
      .sort({ date: -1 })
      .populate('salonId', 'name');
    
    res.json(payments);
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
});

// GET: Payment statistics
router.get('/stats', async (req, res) => {
  try {
    // Total revenue
    const revenueData = await Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Commission (15% of total revenue)
    const totalRevenue = revenueData[0]?.total || 0;
    const commission = totalRevenue * 0.15;
    
    // Monthly revenue (current month)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const monthlyRevenue = await Payment.aggregate([
      { 
        $match: { 
          status: 'success',
          date: { $gte: currentMonth }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Failed payments
    const failedPayments = await Payment.find({ status: 'failed' })
      .sort({ date: -1 })
      .limit(5)
      .populate('salonId', 'name');
    
    res.json({
      totalRevenue,
      commission,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      failedPayments
    });
  } catch (err) {
    console.error('Error fetching payment stats:', err);
    res.status(500).json({ message: 'Failed to fetch payment statistics' });
  }
});

// POST: Create payment
router.post('/', async (req, res) => {
  try {
    const payment = new Payment(req.body);
    const saved = await payment.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error creating payment:', err);
    res.status(500).json({ message: 'Failed to create payment' });
  }
});

// PATCH: Update payment status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Payment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!updated) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    res.json(updated);
  } catch (err) {
    console.error('Error updating payment:', err);
    res.status(500).json({ message: 'Failed to update payment' });
  }
});

module.exports = router;
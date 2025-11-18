const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  method: {
    type: String,
    enum: ['Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer'],
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'pending', 'failed'],
    default: 'pending'
  },
  date: {
    type: Date,
    default: Date.now
  },
  transactionId: String
});

module.exports = mongoose.model('Payment', paymentSchema);
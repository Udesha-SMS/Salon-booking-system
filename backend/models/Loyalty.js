const mongoose = require('mongoose');

const loyaltySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  points: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const loyaltyConfigSchema = new mongoose.Schema({
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon'
  },
  pointsThreshold: {
    type: Number,
    default: 100
  },
  conversionRate: {
    type: Number,
    default: 10
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const Loyalty = mongoose.model('Loyalty', loyaltySchema);
const LoyaltyConfig = mongoose.model('LoyaltyConfig', loyaltyConfigSchema);

module.exports = { Loyalty, LoyaltyConfig };

const mongoose = require('mongoose');

const familyMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Family member name is required'],
    trim: true
  },
  relationship: {
    type: String,
    required: [true, 'Relationship is required'],
    enum: ['Lady', 'Gentleman', 'Teenager', 'Kid', 'Other', 'spouse', 'child', 'parent', 'sibling'],
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: false
  },
  preferences: {
    type: String,
    trim: true,
    default: ''
  }
});

const appointmentSchema = new mongoose.Schema({
  familyMember: familyMemberSchema,
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  serviceName: {
    type: String,
    required: true
  },
  servicePrice: {
    type: Number,
    required: true
  },
  professionalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professional',
    default: null
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  isAdditional: {
    type: Boolean,
    default: false
  }
});

const familyBookingSchema = new mongoose.Schema({
  customerInfo: {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Customer email is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Customer phone is required'],
      trim: true
    }
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true
  },
  bookingDate: {
    type: Date,
    required: [true, 'Booking date is required']
  },
  appointments: [appointmentSchema],
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  specialInstructions: {
    type: String,
    trim: true,
    default: ''
  },
  isGroupBooking: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
familyBookingSchema.index({ 'customerInfo.email': 1, bookingDate: 1 });
familyBookingSchema.index({ salonId: 1, bookingDate: 1 });
familyBookingSchema.index({ 'appointments.status': 1 });

module.exports = mongoose.model('FamilyBooking', familyBookingSchema);
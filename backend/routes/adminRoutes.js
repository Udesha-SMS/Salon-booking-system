const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Salon = require('../models/Salon');
const Professional = require('../models/Professional');
const Feedback = require('../models/feedbackModel');

// Admin Login with hardcoded credentials
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // Hardcoded admin credentials
  const ADMIN_USERNAME = 'admin';
  const ADMIN_PASSWORD = 'admin123';
  
  // Validate credentials
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.json({ 
      success: true, 
      message: 'Login successful',
      admin: {
        username: ADMIN_USERNAME,
        role: 'admin'
      }
    });
  } else {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid username or password' 
    });
  }
});

// GET: Dashboard Statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const totalSalons = await Salon.countDocuments();
    const totalCustomers = await User.countDocuments();
    const totalAppointments = await Appointment.countDocuments();
    
    // Get professionals count across all salons
    const totalEmployees = await Professional.countDocuments();
    
    // Get pending approvals (salons with pending status)
    const pendingApprovals = await Salon.countDocuments({ status: 'pending' });
    
    // Get latest bookings
    const latestBookings = await Appointment.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('salonId', 'name')
      .populate('professionalId', 'name');
    
    // Get latest cancellations
    const latestCancellations = await Appointment.find({ status: 'cancelled' })
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('salonId', 'name');
    
    // Calculate revenue - FIXED VERSION
    let totalRevenue = 0;
    try {
      const revenueData = await Appointment.aggregate([
        { $match: { status: 'completed' } },
        { $unwind: '$services' },
        { $group: { _id: null, total: { $sum: '$services.price' } } }
      ]);
      totalRevenue = revenueData[0]?.total || 0;
    } catch (err) {
      console.error('Error calculating revenue:', err);
    }
    
    // Pending payments - FIXED VERSION
    let pendingPayments = 0;
    try {
      const pendingData = await Appointment.aggregate([
        { $match: { status: 'pending' } },
        { $unwind: '$services' },
        { $group: { _id: null, total: { $sum: '$services.price' } } }
      ]);
      pendingPayments = pendingData[0]?.total || 0;
    } catch (err) {
      console.error('Error calculating pending payments:', err);
    }
    
    // Monthly data for charts - FIXED VERSION
    let monthlyData = [];
    try {
      monthlyData = await Appointment.aggregate([
        {
          $addFields: {
            // Convert string date to Date object
            dateObj: { 
              $cond: {
                if: { $eq: [{ $type: "$date" }, "string"] },
                then: { $toDate: "$date" },
                else: "$date"
              }
            }
          }
        },
        {
          $group: {
            _id: { $month: '$dateObj' },
            bookings: { $sum: 1 },
            revenue: { $sum: { $arrayElemAt: ['$services.price', 0] } }
          }
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            month: '$_id',
            bookings: 1,
            revenue: 1,
            _id: 0
          }
        }
      ]);
      
      // Transform to month names
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      monthlyData = monthlyData.map(item => ({
        name: monthNames[item.month - 1] || `Month ${item.month}`,
        bookings: item.bookings,
        revenue: item.revenue || 0
      }));
    } catch (err) {
      console.error('Error calculating monthly data:', err);
      monthlyData = [];
    }
    
    res.json({
      totalSalons,
      totalCustomers,
      totalEmployees,
      pendingApprovals,
      latestBookings,
      latestCancellations,
      totalRevenue,
      pendingPayments,
      monthlyData,
      alerts: [
        { 
          id: 1, 
          type: 'Warning', 
          details: `${pendingApprovals} pending salon approvals`, 
          action: 'Review' 
        }
      ]
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

// GET: All appointments across all salons
router.get('/appointments', async (req, res) => {
  try {
    const { date } = req.query;
    const query = date ? { date } : {};
    
    const appointments = await Appointment.find(query)
      .sort({ date: -1, startTime: -1 })
      .populate('salonId', 'name')
      .populate('professionalId', 'name');
    
    res.json(appointments);
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ message: 'Failed to fetch appointments' });
  }
});

// PATCH: Update appointment status
router.patch('/appointments/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!updated) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    res.json(updated);
  } catch (err) {
    console.error('Error updating appointment status:', err);
    res.status(500).json({ message: 'Failed to update appointment status' });
  }
});


// GET: All customers with statistics
router.get('/customers', async (req, res) => {
  try {
    const users = await User.find().lean();
    
    // Get booking stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const bookings = await Appointment.countDocuments({ 'user.email': user.email });
        const appointments = await Appointment.find({ 'user.email': user.email });
        
        const totalSpent = appointments.reduce((sum, apt) => {
          return sum + (apt.services?.[0]?.price || 0);
        }, 0);
        
        const lastBooking = appointments.length > 0 
          ? appointments.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date
          : null;
        
        return {
          ...user,
          bookings,
          totalSpent,
          avgSpend: bookings > 0 ? totalSpent / bookings : 0,
          lastBooking,
          isRegistered: true
        };
      })
    );
    
    res.json(usersWithStats);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ message: 'Failed to fetch customers' });
  }
});

// GET: All feedbacks across all salons
router.get('/feedbacks', async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .sort({ createdAt: -1 })
      .populate('salonId', 'name')
      .populate('professionalId', 'name');
    
    res.json(feedbacks);
  } catch (err) {
    console.error('Error fetching feedbacks:', err);
    res.status(500).json({ message: 'Failed to fetch feedbacks' });
  }
});

// PATCH: Update feedback status (approve/reject)
router.patch('/feedbacks/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!updated) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    
    res.json(updated);
  } catch (err) {
    console.error('Error updating feedback:', err);
    res.status(500).json({ message: 'Failed to update feedback' });
  }
});

module.exports = router;
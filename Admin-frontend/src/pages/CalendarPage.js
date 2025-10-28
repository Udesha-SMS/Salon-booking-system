import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import logo from '../assets/logo.png';
import '../css/CalendarPage.css';

const CalendarPage = () => {
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Get calendar data
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  // Fetch appointments for selected date from all salons (OPTIMIZED)
  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const formattedDate = dayjs(selectedDate).format('YYYY-MM-DD');
        
        // Fetch all salons first
        const salonsRes = await axios.get('http://localhost:5000/api/salons');
        const salons = salonsRes.data;

        // Fetch appointments from all salons IN PARALLEL (much faster!)
        const appointmentPromises = salons.map(salon =>
          axios.get(`http://localhost:5000/api/appointments/salon/${salon._id}`)
            .then(res => res.data)
            .catch(() => []) // Return empty array if salon has no appointments
        );

        const allSalonAppointments = await Promise.all(appointmentPromises);

        // Flatten and filter appointments
        const allAppointments = allSalonAppointments
          .flat()
          .filter(a => dayjs(a.date).format('YYYY-MM-DD') === formattedDate)
          .map(a => ({
            id: a._id,
            time: dayjs(`2000-01-01T${a.startTime}`).format('h:mm A'),
            customer: a.user?.name || 'Unknown',
            service: a.services?.[0]?.name || '',
            staff: a.professional?.name || 'Unassigned',
            status: a.status || 'Booked',
          }))
          .sort((a, b) => {
            const timeA = new Date(`2000-01-01 ${a.time}`);
            const timeB = new Date(`2000-01-01 ${b.time}`);
            return timeA - timeB;
          });

        setAppointments(allAppointments);
      } catch (err) {
        console.error('Error loading appointments', err);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [selectedDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
  };

  const handleCancelReschedule = (appointmentId, action) => {
    console.log(`${action} appointment:`, appointmentId);
    // Implement cancel/reschedule logic here
  };

  const filteredAppointments = appointments.filter(apt => 
    apt.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    apt.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
    apt.staff.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-full-page">
      <div className="admin-layout">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <img src={logo} alt="Brand Logo" className="admin-logo" />
          <div className="sidebar-section" style={{ gap: 6 }}>
            <div className="sidebar-link" onClick={() => navigate('/admin-dashboard')} title="Dashboard">
              <i className="fas fa-home"></i>
              <span>Dashboard</span>
            </div>
            <div className="sidebar-link" onClick={() => navigate('/salons')} title="Salons">
              <i className="fas fa-store"></i>
              <span>Salons</span>
            </div>
            <div className="sidebar-link active" onClick={() => navigate('/calendar')} title="Booking">
              <i className="fas fa-calendar-check"></i>
              <span>Booking</span>
            </div>
            <div className="sidebar-link" onClick={() => navigate('/customers')} title="Customers">
              <i className="fas fa-users"></i>
              <span>Customers</span>
            </div>
            <div className="sidebar-link" onClick={() => navigate('/feedback')} title="Feedback">
              <i className="fas fa-comments"></i>
              <span>Feedback</span>
            </div>
            <div className="sidebar-link" onClick={() => navigate('/promotions')} title="Promotions">
              <i className="fas fa-bullhorn"></i>
              <span>Promotions</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="admin-main-content">
          <div className="calendar-page-container">
            {/* Header */}
            <div className="calendar-page-header">
              <div>
                <h1 className="calendar-page-title">Today's Appointments</h1>
                <p className="calendar-page-subtitle">Manage all appointments for today across all locations</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="calendar-search-bar">
              <i className="fas fa-search"></i>
              <input 
                type="text" 
                placeholder="Search by customer, service, or staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Calendar Widget */}
            <div className="calendar-widget">
              <div className="calendar-widget-header">
                <button onClick={handlePrevMonth} className="calendar-nav-btn">
                  <i className="fas fa-chevron-left"></i>
                </button>
                <h3 className="calendar-month-year">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={handleNextMonth} className="calendar-nav-btn">
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>

              <div className="calendar-grid">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <div key={index} className="calendar-day-header">{day}</div>
                ))}
                
                {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                  <div key={`empty-${index}`} className="calendar-day empty"></div>
                ))}
                
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const isToday = day === new Date().getDate() && 
                                  currentDate.getMonth() === new Date().getMonth() &&
                                  currentDate.getFullYear() === new Date().getFullYear();
                  const isSelected = day === selectedDate.getDate() &&
                                     currentDate.getMonth() === selectedDate.getMonth() &&
                                     currentDate.getFullYear() === selectedDate.getFullYear();
                  
                  return (
                    <div 
                      key={day} 
                      className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleDateClick(day)}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Appointments Section */}
            <div className="appointments-section">
              <h2 className="appointments-section-title">Appointments</h2>
              
              <div className="appointments-table-container">
                <table className="appointments-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Customer</th>
                      <th>Service</th>
                      <th>Staff</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="loading-appointments">
                          <i className="fas fa-spinner fa-spin"></i> Loading appointments...
                        </td>
                      </tr>
                    ) : filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="no-appointments">
                          No appointments found for this date
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map((appointment) => (
                        <tr key={appointment.id}>
                          <td className="appointment-time">{appointment.time}</td>
                          <td>{appointment.customer}</td>
                          <td className="appointment-service">{appointment.service}</td>
                          <td>{appointment.staff}</td>
                          <td>
                            <span className="status-badge">{appointment.status}</span>
                          </td>
                          <td>
                            <div className="appointment-actions">
                              <button 
                                className="action-link cancel"
                                onClick={() => handleCancelReschedule(appointment.id, 'Cancel')}
                              >
                                Cancel
                              </button>
                              <span className="action-separator">/</span>
                              <button 
                                className="action-link reschedule"
                                onClick={() => handleCancelReschedule(appointment.id, 'Reschedule')}
                              >
                                Reschedule
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CalendarPage;



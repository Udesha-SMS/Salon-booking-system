import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import './CalendarPage.css';

const CalendarPage = () => {
  const navigate = useNavigate();

  // Set to July 2024 as requested
  const [currentDate, setCurrentDate] = useState(new Date(2024, 6, 1)); // July 2024
  const [selectedDate, setSelectedDate] = useState(new Date(2024, 6, 15)); // July 15, 2024
  const [searchQuery, setSearchQuery] = useState('');

  // Sample appointments data
  const [appointments] = useState([
    {
      id: 1,
      time: '9:00 AM',
      customer: 'Sophia Clark',
      service: 'Haircut & Style',
      staff: 'Emily White',
      status: 'Booked',
      date: '2024-07-15'
    },
    {
      id: 2,
      time: '10:30 AM',
      customer: 'Liam Carter',
      service: 'Manicure',
      staff: 'Olivia Green',
      status: 'Booked',
      date: '2024-07-15'
    },
    {
      id: 3,
      time: '11:00 AM',
      customer: 'Emma Wilson',
      service: 'Facial Treatment',
      staff: 'Emily White',
      status: 'Booked',
      date: '2024-07-15'
    },
    {
      id: 4,
      time: '1:00 PM',
      customer: 'Noah Anderson',
      service: 'Hair Coloring',
      staff: 'Olivia Green',
      status: 'Confirmed',
      date: '2024-07-15'
    },
    {
      id: 5,
      time: '2:30 PM',
      customer: 'Ava Martinez',
      service: 'Pedicure',
      staff: 'Emily White',
      status: 'Booked',
      date: '2024-07-15'
    },
    {
      id: 6,
      time: '3:30 PM',
      customer: 'Oliver Brown',
      service: 'Beard Trim',
      staff: 'James Taylor',
      status: 'Pending',
      date: '2024-07-15'
    },
    {
      id: 7,
      time: '4:00 PM',
      customer: 'Isabella Davis',
      service: 'Spa Package',
      staff: 'Olivia Green',
      status: 'Booked',
      date: '2024-07-15'
    }
  ]);

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

  const handleCancelAppointment = (appointmentId) => {
    console.log('Cancel appointment:', appointmentId);
    alert('Cancel appointment functionality would be implemented here');
  };

  const handleRescheduleAppointment = (appointmentId) => {
    console.log('Reschedule appointment:', appointmentId);
    alert('Reschedule appointment functionality would be implemented here');
  };

  // Filter appointments by selected date and search query
  const filteredAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    const matchesDate = aptDate.getDate() === selectedDate.getDate() &&
                       aptDate.getMonth() === selectedDate.getMonth() &&
                       aptDate.getFullYear() === selectedDate.getFullYear();
    
    const matchesSearch = apt.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         apt.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         apt.staff.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesDate && matchesSearch;
  });

  // Get status badge class
  const getStatusClass = (status) => {
    switch(status.toLowerCase()) {
      case 'booked': return 'status-booked';
      case 'confirmed': return 'status-confirmed';
      case 'pending': return 'status-pending';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  return (
    <AdminLayout>
      <div className="appointments-page-container">
        {/* Header */}
        <div className="appointments-header">
          <div>
            <h1 className="appointments-title">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Today's Appointments
            </h1>
            <p className="appointments-subtitle">
              Manage all appointments for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="appointments-search-bar">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search by customer, service, or staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Main Content: Calendar + Appointments */}
        <div className="appointments-content">
          {/* Left: Calendar Sidebar */}
          <div className="calendar-sidebar">
            <div className="calendar-widget">
              <div className="calendar-header">
                <button onClick={handlePrevMonth} className="calendar-nav-btn">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="calendar-month">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={handleNextMonth} className="calendar-nav-btn">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="calendar-grid">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                  <div key={index} className="calendar-weekday">{day}</div>
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

            {/* Calendar Info */}
            <div className="calendar-info">
              <div className="info-item">
                <div className="info-badge today-badge"></div>
                <span>Today</span>
              </div>
              <div className="info-item">
                <div className="info-badge selected-badge"></div>
                <span>Selected Date</span>
              </div>
            </div>
          </div>

          {/* Right: Appointments Table */}
          <div className="appointments-section">
            <div className="appointments-table-header">
              <h2 className="table-title">Appointments</h2>
              <div className="appointments-count">
                {filteredAppointments.length} {filteredAppointments.length === 1 ? 'appointment' : 'appointments'}
              </div>
            </div>
            
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
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-appointments">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p>No appointments found for this date</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td className="appointment-time">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {appointment.time}
                        </td>
                        <td className="appointment-customer">{appointment.customer}</td>
                        <td className="appointment-service">{appointment.service}</td>
                        <td className="appointment-staff">{appointment.staff}</td>
                        <td>
                          <span className={`status-badge ${getStatusClass(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </td>
                        <td>
                          <div className="appointment-actions">
                            <button 
                              className="action-btn cancel-btn"
                              onClick={() => handleCancelAppointment(appointment.id)}
                              title="Cancel Appointment"
                            >
                              Cancel
                            </button>
                            <span className="action-separator">/</span>
                            <button 
                              className="action-btn reschedule-btn"
                              onClick={() => handleRescheduleAppointment(appointment.id)}
                              title="Reschedule Appointment"
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
      </div>
    </AdminLayout>
  );
};

export default CalendarPage;
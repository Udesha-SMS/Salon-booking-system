// ConfirmationPage.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../css/ConfirmationPage.css";

const ConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const {
    salonName = "Our Salon",
    appointmentDetails = [],
    totalAmount = 0,
    bookingId = `booking-${Date.now()}`,
    customerName = "Guest",
    isGroupBooking = false,
    salonLocation = "",
    professionalName = "Any Professional",
    services = [],
    groupMembers = []
  } = location.state || {};

  console.log("📋 Confirmation Page Data:", {
    salonName,
    appointmentDetails,
    totalAmount,
    bookingId,
    customerName,
    isGroupBooking
  });

  const formatDate = (dateString) => {
    if (!dateString) return "Date not specified";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleViewBookings = () => {
    navigate("/appointments");
  };

  // Calculate total services and duration
  const getTotalServices = () => {
    return appointmentDetails.length;
  };

  const getTotalDuration = () => {
    return appointmentDetails.reduce((total, appointment) => {
      const duration = appointment.duration || "0 minutes";
      const hoursMatch = duration.match(/(\d+)\s*hour/);
      const minutesMatch = duration.match(/(\d+)\s*min/);
      
      const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
      const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
      
      return total + (hours * 60) + minutes;
    }, 0);
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0 && mins > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${mins} minute${mins > 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="confirmation-container">
      <div className="confirmation-card">
        <div className="confirmation-header">
          <div className="success-icon">✅</div>
          <h1>Booking Confirmed!</h1>
          <p className="thank-you-message">
  Thank you for choosing <strong>{salonName}</strong>!
  <br />
  Your {isGroupBooking ? 'group appointments have' : 'appointment has'} been successfully booked.
  <br />
  We’re excited to make your visit special.
</p>
        </div>

        <div className="confirmation-details">
          <div className="booking-summary">
            <h2>Booking Summary</h2>
            
            <div className="summary-grid">
              {/* <div className="summary-item">
                <span>Booking ID:</span>
                <strong>{bookingId}</strong>
              </div> */}
              
              <div className="summary-item">
                <span>Customer Name:</span>
                <strong>{customerName}</strong>
              </div>

              <div className="summary-item">
                <span>Salon:</span>
                <strong>{salonName}</strong>
              </div>

              {salonLocation && (
                <div className="summary-item">
                  <span>Location:</span>
                  <span>{salonLocation}</span>
                </div>
              )}

              <div className="summary-item">
                <span>Total Services:</span>
                <strong>{getTotalServices()}</strong>
              </div>

              <div className="summary-item">
                <span>Total Duration:</span>
                <strong>{formatDuration(getTotalDuration())}</strong>
              </div>
            </div>

            {appointmentDetails.length > 0 && (
              <div className="appointments-list">
                <h3>{isGroupBooking ? 'Group Appointments Details' : 'Appointment Details'}</h3>
                {appointmentDetails.map((appointment, index) => (
                  <div key={index} className="appointment-card">
                    {isGroupBooking && (
                      <div className="member-info">
                        <strong>👤 {appointment.memberName}</strong>
                        {appointment.memberCategory && (
                          <span className="member-category">({appointment.memberCategory})</span>
                        )}
                      </div>
                    )}
                    <div className="appointment-details-grid">
                      <div className="detail-row">
                        <span className="detail-label">Service:</span>
                        <span className="detail-value">{appointment.serviceName}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Professional:</span>
                        <span className="detail-value">{appointment.professionalName}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Date:</span>
                        <span className="detail-value">{formatDate(appointment.date)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Time:</span>
                        <span className="detail-value">{appointment.startTime} - {appointment.endTime}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Duration:</span>
                        <span className="detail-value">{appointment.duration}</span>
                      </div>
                      <div className="detail-row price-row">
                        <span className="detail-label">Price:</span>
                        <span className="detail-value price">LKR {appointment.price?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="total-amount-section">
              <div className="total-amount">
                <span>Total Amount:</span>
                <strong>LKR {totalAmount.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          <div className="important-notes">
            <h3>Important Information</h3>
            <ul>
              <li>📍 Please arrive 10-15 minutes before your scheduled appointment</li>
              <li>⏰ Late arrivals may result in reduced service time</li>
              <li>💳 Payment will be collected at the salon</li>
              {isGroupBooking && (
                <li>👥 All group members should arrive together for their appointments</li>
              )}
              <li>📱 You will receive a confirmation SMS and email shortly</li>
              <li>🔄 Changes or cancellations can be made up to 24 hours before the appointment</li>
            </ul>
          </div>
        </div>

        <div className="confirmation-actions">
          <button 
            className="btn-primary"
            onClick={handleBackToHome}
          >
            Back to Home
          </button>
          <button 
            className="btn-secondary"
            onClick={handleViewBookings}
          >
            View My Bookings
          </button>
        </div>

        <div className="confirmation-footer">
          <p>We can't wait to see you at {salonName}! 💫</p>
          <p className="footer-note">A confirmation has been sent to your registered email and phone number.</p>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;
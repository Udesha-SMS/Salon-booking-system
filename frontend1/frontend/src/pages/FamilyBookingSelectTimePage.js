// SelectTimePage.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../css/FamilyBookingSelectTime.css";
import { filterMatchingSlots } from "../utils/slotUtils";

const SelectTimePage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const passedServices = location.state?.selectedServices || JSON.parse(localStorage.getItem("selectedServices")) || [];
  const passedProfessional = location.state?.selectedProfessional || JSON.parse(localStorage.getItem("selectedProfessional")) || null;
  const salon = location.state?.salon || JSON.parse(localStorage.getItem("selectedSalon")) || null;
  const rescheduleAppointment = location.state?.rescheduleAppointment || null;
  const isReschedule = !!rescheduleAppointment;

  const isGroupBooking = location.state?.isGroupBooking || JSON.parse(localStorage.getItem("isGroupBooking")) || false;
  const groupMembers = location.state?.groupMembers || JSON.parse(localStorage.getItem("groupMembers")) || [];

  // Get existing booked appointments from previous bookings in this session
  const initialBookedAppointments = (() => {
    // First try from location state (most recent)
    const fromState = location.state?.bookedAppointments;
    if (fromState && Array.isArray(fromState) && fromState.length > 0) {
      console.log("✅ Loaded appointments from location state:", fromState.length);
      return fromState;
    }
    
    // Then try from localStorage
    const fromStorage = localStorage.getItem('bookedAppointments');
    if (fromStorage) {
      try {
        const parsed = JSON.parse(fromStorage);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log("✅ Loaded appointments from localStorage:", parsed.length);
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse bookedAppointments from localStorage:", e);
      }
    }
    
    console.log("ℹ️ No previous appointments found");
    return [];
  })();

  const user = JSON.parse(localStorage.getItem("user"));

  const [selectedServices, setSelectedServices] = useState(passedServices);
  const [selectedProfessional, setSelectedProfessional] = useState(passedProfessional);
  const [phone, setPhone] = useState(user?.phone || "");
  const currentServiceIndex = useRef(0);
  const [renderKey, setRenderKey] = useState(0);
  const [selectedDates, setSelectedDates] = useState({});
  const [selectedTimes, setSelectedTimes] = useState({});
  const [availableSlots, setAvailableSlots] = useState({});
  const [loading, setLoading] = useState(false);

  // Store all booked appointments (from current session + new ones)
  const [bookedAppointments, setBookedAppointments] = useState(initialBookedAppointments);

  useEffect(() => {
    console.log("🔍 DEBUG - SelectTimePage State:", {
      isGroupBooking,
      groupMembers,
      selectedServices,
      bookedAppointments: bookedAppointments.length,
      currentServiceIndex: currentServiceIndex.current
    });
  }, [isGroupBooking, groupMembers, selectedServices, bookedAppointments]);

  const dates = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        date: date.getDate(),
        fullDate: date.toISOString().split("T")[0],
      });
    }
    return days;
  }, []);

  const resolveProfessionalId = (prof, currentServiceName) => {
    if (!prof) return null;
    if (typeof prof === "string" && prof.trim()) return prof;
    if (prof._id) return prof._id;
    if (prof.professionalId && typeof prof.professionalId === "string") return prof.professionalId;
    if (prof.professionalId && prof.professionalId._id) return prof.professionalId._id;
    if (currentServiceName && prof[currentServiceName]) {
      if (typeof prof[currentServiceName] === "string") return prof[currentServiceName];
      if (prof[currentServiceName]._id) return prof[currentServiceName]._id;
    }
    return null;
  };

  const fetchTimeSlots = async (professionalId, date) => {
    if (!professionalId || !date) {
      console.warn("fetchTimeSlots called without professionalId or date", { professionalId, date });
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/timeslots?professionalId=${professionalId}&date=${date}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const key = `${professionalId}-${date}`;
      setAvailableSlots(prev => ({ ...prev, [key]: Array.isArray(data) ? data : [] }));
    } catch (err) {
      console.error("Error fetching time slots:", err);
      const key = `${professionalId}-${date}`;
      setAvailableSlots(prev => ({ ...prev, [key]: [] }));
    }
  };

  useEffect(() => {
    if (!selectedProfessional || selectedServices.length === 0) return;
    
    const currentService = selectedServices[currentServiceIndex.current];
    if (!currentService) return;

    let professionalId = null;
    
    if (selectedProfessional._id) {
      professionalId = selectedProfessional._id;
    } else if (selectedProfessional[currentService.name]?._id) {
      professionalId = selectedProfessional[currentService.name]._id;
    } else if (Array.isArray(selectedProfessional) && selectedProfessional.length > 0) {
      professionalId = selectedProfessional[0]?._id;
    } else if (selectedProfessional.professionalId) {
      professionalId = selectedProfessional.professionalId;
    } else if (typeof selectedProfessional === 'string') {
      professionalId = selectedProfessional;
    }

    if (!professionalId) {
      console.error("No professional ID found");
      return;
    }

    const defaultDate = dates[0]?.fullDate;

    if (defaultDate) {
      setSelectedDates((prev) => ({ ...prev, [currentService.name]: defaultDate }));
      setSelectedTimes((prev) => ({ ...prev, [currentService.name]: null }));
      fetchTimeSlots(professionalId, defaultDate);
    }
  }, [selectedProfessional, selectedServices, dates]);

  const currentService = selectedServices[currentServiceIndex.current] || {};
  const serviceKey = currentService.name || "service";
  const professionalId = resolveProfessionalId(selectedProfessional, currentService.name);
  const selectedDate = selectedDates[serviceKey] || dates[0]?.fullDate;
  const slotKey = professionalId && selectedDate ? `${professionalId}-${selectedDate}` : null;
  const rawSlots = slotKey ? availableSlots[slotKey] : [];
  const safeSlots = Array.isArray(rawSlots) ? rawSlots : [];
  const filteredSlots = currentService.duration ? filterMatchingSlots(safeSlots, currentService.duration) : safeSlots;

  const handleDateClick = (serviceName, profId, fullDate) => {
    setSelectedDates(prev => ({ ...prev, [serviceName]: fullDate }));
    setSelectedTimes(prev => ({ ...prev, [serviceName]: null }));
    fetchTimeSlots(profId, fullDate);
  };

  const handleTimeClick = (serviceName, slotId, isBooked) => {
    if (isBooked) return;
    setSelectedTimes(prev => ({ ...prev, [serviceName]: slotId }));
  };

  const computeEndFromStartAndDuration = (startTime, durationStr) => {
    if (!startTime) return "";
    const parts = durationStr.split(" ");
    let minutes = 0;
    for (let i = 0; i < parts.length; i += 2) {
      const val = parseInt(parts[i]);
      const unit = parts[i + 1]?.toLowerCase() || "";
      if (unit.includes("hour")) minutes += (isNaN(val) ? 0 : val) * 60;
      else if (unit.includes("min")) minutes += isNaN(val) ? 0 : val;
    }
    const [h, m] = startTime.split(":").map(Number);
    const total = h * 60 + m + minutes;
    const endH = String(Math.floor(total / 60)).padStart(2, "0");
    const endM = String(total % 60).padStart(2, "0");
    return `${endH}:${endM}`;
  };

  const getCurrentAppointmentData = () => {
    const slotId = selectedTimes[serviceKey];
    const date = selectedDates[serviceKey];
    const selectedSlot = filteredSlots.find(s => (s._id && s._id === slotId) || (s.id && s.id === slotId) || (s.startTime && s.startTime === slotId));
    const startTime = selectedSlot?.startTime || selectedSlot?.start;
    const endTime = computeEndFromStartAndDuration(startTime, currentService.duration);

    let memberName = user?.name || "Guest";
    let memberCategory = 'Primary';

    if (isGroupBooking && groupMembers.length > 0) {
      const currentMember = groupMembers[currentServiceIndex.current];
      if (currentMember) {
        memberName = currentMember.name || `Member ${currentServiceIndex.current + 1}`;
        memberCategory = currentMember.category || 'Adult';
      }
    }

    return {
      serviceName: currentService.name,
      price: currentService.price,
      duration: currentService.duration,
      date,
      startTime,
      endTime,
      professionalId: professionalId,
      professionalName: selectedProfessional?.name || "Any Professional",
      salonId: salon?._id,
      slotIds: selectedSlot?.slotIds || [selectedSlot?._id].filter(Boolean),
      memberName: memberName,
      memberCategory: memberCategory
    };
  };

  const handleContinue = () => {
    if (!selectedTimes[serviceKey]) {
      alert("❌ Please select a time for the current service.");
      return;
    }
    
    // Check if there are more services to book
    if (currentServiceIndex.current + 1 < selectedServices.length) {
      // Add current appointment to booked list
      const currentAppointment = getCurrentAppointmentData();
      const updatedBookedAppointments = [...bookedAppointments, currentAppointment];
      
      console.log("💾 Saving appointment:", currentAppointment);
      console.log("📊 Total booked after save:", updatedBookedAppointments.length);
      
      setBookedAppointments(updatedBookedAppointments);
      
      // Also save to localStorage for persistence
      localStorage.setItem('bookedAppointments', JSON.stringify(updatedBookedAppointments));
      
      // Move to next service
      currentServiceIndex.current += 1;
      setRenderKey(k => k + 1);
      
      const nextService = selectedServices[currentServiceIndex.current];
      if (nextService) {
        setSelectedTimes(prev => ({ ...prev, [nextService.name]: null }));
      }
    } else {
      // All services booked, add final appointment and navigate to confirmation
      const currentAppointment = getCurrentAppointmentData();
      const finalBookedAppointments = [...bookedAppointments, currentAppointment];
      
      console.log("💾 Adding final appointment:", currentAppointment);
      console.log("📊 Final total appointments:", finalBookedAppointments.length);
      
      setBookedAppointments(finalBookedAppointments);
      localStorage.setItem('bookedAppointments', JSON.stringify(finalBookedAppointments));
      
      // Navigate to confirmation page with all appointment data
      navigateToConfirmation(finalBookedAppointments);
    }
  };

  const handleAddAppointment = () => {
    if (!selectedTimes[serviceKey]) {
      alert("❌ Please select a time for the current service.");
      return;
    }
    
    // Add ALL pending appointments (already booked + current one)
    const allAppointmentsToSave = [...bookedAppointments];
    
    // Add current appointment if time is selected
    if (selectedTimes[serviceKey]) {
      allAppointmentsToSave.push(getCurrentAppointmentData());
    }
    
    // Store in localStorage for persistence
    localStorage.setItem('bookedAppointments', JSON.stringify(allAppointmentsToSave));
    localStorage.setItem('isGroupBooking', JSON.stringify(true));
    localStorage.setItem('selectedSalon', JSON.stringify(salon));
    
    // Clear service selection for next round
    localStorage.removeItem('selectedServices');
    localStorage.removeItem('selectedProfessional');
    localStorage.removeItem('groupMembers');
    
    // Navigate back to family booking page to add more members
    navigate('/familybooking', {
      state: {
        salon,
        bookedAppointments: allAppointmentsToSave,
        isGroupBooking: true
      }
    });
  };

  // UPDATED FUNCTION: Navigate to confirmation page with all appointment data
  const navigateToConfirmation = (appointments) => {
    const totalAmount = calculateTotalPrice(appointments);
    
    const confirmationData = {
      salonName: salon?.name || "Our Salon",
      appointmentDetails: appointments,
      totalAmount: totalAmount,
      bookingId: `booking-${Date.now()}`,
      customerName: user?.name || "Guest",
      isGroupBooking: isGroupBooking,
      // Include additional details for the summary
      salonLocation: salon?.location,
      professionalName: selectedProfessional?.name || "Any Professional",
      services: selectedServices,
      groupMembers: groupMembers
    };

    console.log("✅ Navigating to confirmation with data:", {
      totalAmount,
      appointmentCount: appointments.length,
      isGroupBooking,
      appointments
    });

    // Clear localStorage after successful booking
    localStorage.removeItem('bookedAppointments');
    localStorage.removeItem('selectedServices');
    localStorage.removeItem('selectedProfessional');
    localStorage.removeItem('selectedSalon');
    localStorage.removeItem('isGroupBooking');
    localStorage.removeItem('groupMembers');

    // Navigate to confirmation page
    navigate("/confirmationpage", { state: confirmationData });
  };

  // Fixed: Correctly get all appointments for display including current one
  const getAllAppointmentsForDisplay = () => {
    const allAppointments = [...bookedAppointments];
    
    // If there's a current appointment selected, include it
    if (selectedTimes[serviceKey]) {
      allAppointments.push(getCurrentAppointmentData());
    }
    
    return allAppointments;
  };

  // Calculate total price consistently
  const calculateTotalPrice = (appointments = null) => {
    const allAppointments = appointments || getAllAppointmentsForDisplay();
    return allAppointments.reduce((total, appointment) => {
      return total + (Number(appointment.price) || 0);
    }, 0);
  };

  const appointmentsToDisplay = getAllAppointmentsForDisplay();
  const totalAmount = calculateTotalPrice();

  if (selectedServices.length === 0) {
    return (
      <div className="select-services-container">
        <div className="left-column">
          <h2>No services selected</h2>
          <button onClick={() => navigate("/")}>Go back to services</button>
        </div>
      </div>
    );
  }

  return (
    <div className="select-services-container" key={renderKey}>
      <div className="left-column">
        <p className="breadcrumb">Services &gt; Professional &gt; <b>Time</b> &gt; Confirmation</p>
        <h2 className="heading-with-search">
          Select Time for {currentService.name}
          {isGroupBooking && ` - ${groupMembers[currentServiceIndex.current]?.name || `Member ${currentServiceIndex.current + 1}`}`}
        </h2>

        {selectedServices.length > 1 && (
          <div className="service-progress">
            <p>Service {currentServiceIndex.current + 1} of {selectedServices.length}</p>
            {bookedAppointments.length > 0 && (
              <p>✅ {bookedAppointments.length} appointment(s) already added</p>
            )}
          </div>
        )}

        <div className="date-buttons">
          {dates.map(day => (
            <button
              key={day.fullDate}
              className={`date-button ${selectedDates[serviceKey] === day.fullDate ? "selected" : ""}`}
              onClick={() => handleDateClick(serviceKey, professionalId, day.fullDate)}
            >
              <span>{day.date}</span><small>{day.day}</small>
            </button>
          ))}
        </div>

        <div className="services-list">
          {!professionalId ? (
            <p>No professional selected</p>
          ) : !selectedDate ? (
            <p>Please select a date</p>
          ) : filteredSlots.length === 0 ? (
            <p>No available time slots for {new Date(selectedDate).toLocaleDateString()}</p>
          ) : (
            filteredSlots.map(slot => {
              const slotId = slot._id || slot.id || slot.startTime;
              const isSelected = selectedTimes[serviceKey] === slotId;
              const isBooked = !!slot.isBooked;

              return (
                <div
                  key={slotId}
                  className={`service-card ${isBooked ? "disabled" : isSelected ? "selected" : ""}`}
                  onClick={() => handleTimeClick(serviceKey, slotId, isBooked)}
                  style={{ pointerEvents: isBooked ? "none" : "auto" }}
                >
                  <p>{slot.startTime} - {slot.endTime}</p>
                  <p>{isBooked ? "❌ Booked" : `LKR ${currentService.price}`}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="right-column">
        <div className="summary-box">
          <img
            src={salon?.image ? (salon.image.startsWith("http") ? salon.image : `http://localhost:5000/uploads/${salon.image}`) : "https://via.placeholder.com/150"}
            alt="Salon"
            className="salon-image"
          />
          <div className="salon-info">
            <h4>{salon?.name}</h4>
            <p>{salon?.location}</p>
            
            {/* Show all booked appointments */}
            {appointmentsToDisplay.length > 0 && (
              <div className="booked-appointments-summary">
                <h5>{isGroupBooking ? "Group Booking Summary:" : "Booking Summary:"}</h5>
                {appointmentsToDisplay.map((appointment, index) => (
                  <div key={index} className="appointment-item">
                    <p><strong>👤 {appointment.memberName}</strong> {isGroupBooking && `(${appointment.memberCategory})`}</p>
                    <p>💇 {appointment.serviceName}</p>
                    <p>🧑‍💼 {appointment.professionalName}</p>
                    <p>📅 {new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                    <p>🕒 {appointment.startTime} - {appointment.endTime}</p>
                    <p className="price-tag">LKR {appointment.price.toLocaleString()}</p>
                    {index < appointmentsToDisplay.length - 1 && <hr />}
                  </div>
                ))}
              </div>
            )}
            
            <div className="total-section">
              <p>Total Amount</p>
              <p><strong>LKR {totalAmount.toLocaleString()}</strong></p>
            </div>
          </div>
          
          <div className="booking-buttons">
            <button 
              className="continue-button" 
              onClick={handleContinue} 
              disabled={!selectedTimes[serviceKey]}
            >
              {currentServiceIndex.current + 1 < selectedServices.length 
                ? "Continue to Next Member" 
                : `Confirm the Booking (LKR ${totalAmount.toLocaleString()})`
              }
            </button>
            
            {isGroupBooking && (
              <button 
                className="add-appointment-button"
                onClick={handleAddAppointment}
                disabled={!selectedTimes[serviceKey]}
              >
                Add Another Appointment
              </button>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loader">
            <div className="loader-dots"><div></div><div></div><div></div></div>
            <p>Processing your {isGroupBooking ? 'group booking' : 'appointment'}...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectTimePage;
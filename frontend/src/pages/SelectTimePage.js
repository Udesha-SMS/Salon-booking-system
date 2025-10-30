// SelectTimePage.jsx - FINAL FIXED VERSION
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../css/SelectTimePage.css";
import { filterMatchingSlots } from "../utils/slotUtils";

const SelectTimePage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const passedServices = location.state?.selectedServices || JSON.parse(localStorage.getItem("selectedServices")) || [];
  const passedProfessional = location.state?.selectedProfessional || JSON.parse(localStorage.getItem("selectedProfessional")) || null;
  const salon = location.state?.salon || JSON.parse(localStorage.getItem("selectedSalon")) || null;
  const rescheduleAppointment = location.state?.rescheduleAppointment || null;
  const isReschedule = !!rescheduleAppointment;

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

  // Calculate total amount for all services
  const totalAmount = useMemo(() => {
    return selectedServices.reduce((total, service) => {
      return total + (parseFloat(service.price) || 0);
    }, 0);
  }, [selectedServices]);

  // stable dates for next 7 days
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

  // Helper: resolve professional id
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
    if (rescheduleAppointment?.professionalId) {
      if (typeof rescheduleAppointment.professionalId === "string") return rescheduleAppointment.professionalId;
      if (rescheduleAppointment.professionalId._id) return rescheduleAppointment.professionalId._id;
    }
    return null;
  };

  // Fetch time slots
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
      console.debug("Fetched slots", key, Array.isArray(data) ? data.length : typeof data);
    } catch (err) {
      console.error("Error fetching time slots:", err);
      const key = `${professionalId}-${date}`;
      setAvailableSlots(prev => ({ ...prev, [key]: [] }));
    }
  };

  // Init reschedule data
  useEffect(() => {
    if (!isReschedule || !rescheduleAppointment) return;
    if (rescheduleAppointment.professionalId) {
      setSelectedProfessional(rescheduleAppointment.professionalId);
    }
    if (rescheduleAppointment.services?.length) {
      const mapped = rescheduleAppointment.services.map(s => ({
        name: s.name,
        price: s.price,
        duration: s.duration || "30 minutes",
      }));
      setSelectedServices(mapped);
    }
  }, [isReschedule, rescheduleAppointment]);

  // Fetch default date slots
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

    const defaultDate = isReschedule && rescheduleAppointment?.date 
      ? rescheduleAppointment.date 
      : dates[0]?.fullDate;

    if (defaultDate) {
      setSelectedDates((prev) => ({ ...prev, [currentService.name]: defaultDate }));
      setSelectedTimes(prev => ({ ...prev, [currentService.name]: null }));
      fetchTimeSlots(professionalId, defaultDate);
    }
  }, [selectedProfessional, selectedServices, isReschedule, rescheduleAppointment, dates]);

  // Build derived values
  const currentService = selectedServices[currentServiceIndex.current] || {};
  const serviceKey = currentService.name || "service";
  const professionalId = resolveProfessionalId(selectedProfessional, currentService.name);
  const selectedDate = selectedDates[serviceKey] || dates[0]?.fullDate;
  const slotKey = professionalId && selectedDate ? `${professionalId}-${selectedDate}` : null;
  const rawSlots = slotKey ? availableSlots[slotKey] : [];
  const safeSlots = Array.isArray(rawSlots) ? rawSlots : [];
  const filteredSlots = currentService.duration ? filterMatchingSlots(safeSlots, currentService.duration) : safeSlots;

  // Auto-select time for reschedule
  useEffect(() => {
    if (!isReschedule || !rescheduleAppointment) return;
    if (!currentService.name) return;
    if (!filteredSlots || filteredSlots.length === 0) return;

    const appointmentStart = rescheduleAppointment.startTime;
    if (!appointmentStart) return;

    const matching = filteredSlots.find(s => 
      s.startTime === appointmentStart || 
      s.start === appointmentStart || 
      s._id === rescheduleAppointment.slotId || 
      (s.slotIds && s.slotIds.includes(rescheduleAppointment.slotId))
    );
    
    if (matching && !matching.isBooked) {
      setSelectedTimes(prev => ({ ...prev, [serviceKey]: matching._id || matching.id || matching.startTime }));
    }
  }, [filteredSlots, isReschedule, rescheduleAppointment, serviceKey]);

  // Compute end time helper
  const computeEndFromStartAndDuration = (startTime, durationStr) => {
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

  // Handlers
  const handleDateClick = (serviceName, profId, fullDate) => {
    setSelectedDates(prev => ({ ...prev, [serviceName]: fullDate }));
    setSelectedTimes(prev => ({ ...prev, [serviceName]: null }));
    fetchTimeSlots(profId, fullDate);
  };

  const handleTimeClick = (serviceName, slotId, isBooked) => {
    if (isBooked) return;
    setSelectedTimes(prev => ({ ...prev, [serviceName]: slotId }));
  };

  // ✅ Create appointment via API with CORRECT format
  const createAppointment = async (appointmentData) => {
    try {
      setLoading(true);
      console.log("📤 Sending appointment data:", {
        phone: user?.phone || "",
        email: user?.email || "",
        name: user?.name || "Guest",
        appointments: [appointmentData]
      });

      const response = await fetch("http://localhost:5000/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: user?.phone || "",
          email: user?.email || "",
          name: user?.name || "Guest",
          appointments: [appointmentData]
        }),
      });

      const result = await response.json();
      console.log("📥 Server response:", result);
      console.log("📥 Response status:", response.status);
      console.log("📥 Response ok:", response.ok);
      console.log("📥 Result success:", result.success);
      console.log("📥 Result message:", result.message);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create appointment");
      }

      return result.data[0]; // Return the created appointment
    } catch (error) {
      console.error("❌ Error creating appointment:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Navigate to confirmation
  const navigateToConfirmation = (createdAppointment) => {
    const confirmationData = {
      salonName: salon?.name || "Our Salon",
      appointmentDetails: [{
        serviceName: createdAppointment.services[0].name,
        price: createdAppointment.services[0].price,
        duration: createdAppointment.services[0].duration,
        date: createdAppointment.date,
        startTime: createdAppointment.startTime,
        endTime: createdAppointment.endTime,
        professionalName: selectedProfessional?.name || "Any Professional",
      }],
      totalAmount: totalAmount,
      bookingId: createdAppointment._id,
      customerName: user?.name || "Guest",
      isGroupBooking: false,
      salonLocation: salon?.location,
      professionalName: selectedProfessional?.name || "Any Professional",
      services: selectedServices,
      appointmentId: createdAppointment._id
    };

    console.log("✅ Navigating to confirmation with data:", confirmationData);

    // Clear localStorage
    localStorage.removeItem('selectedServices');
    localStorage.removeItem('selectedProfessional');
    localStorage.removeItem('selectedSalon');

    navigate("/confirmationpage", { state: confirmationData });
  };

  const handleContinue = async () => {
    console.log("🔵 handleContinue called");
    console.log("🔵 serviceKey:", serviceKey);
    console.log("🔵 selectedTimes:", selectedTimes);
    console.log("🔵 selectedTimes[serviceKey]:", selectedTimes[serviceKey]);
    
    if (!selectedTimes[serviceKey]) {
      alert("❌ Please select a time for the current service.");
      return;
    }

    const slotId = selectedTimes[serviceKey];
    const date = selectedDates[serviceKey];
    
    console.log("🔵 Looking for slot with ID:", slotId);
    console.log("🔵 Available filteredSlots:", filteredSlots);
    
    const selectedSlot = filteredSlots.find(s => 
      (s._id && s._id === slotId) || 
      (s.id && s.id === slotId) || 
      (s.startTime && s.startTime === slotId)
    );

    console.log("🔵 Found selectedSlot:", selectedSlot);

    if (!selectedSlot) {
      alert("Selected slot not available. Please pick another time.");
      return;
    }

    const startTime = selectedSlot.startTime || selectedSlot.start;
    const endTime = computeEndFromStartAndDuration(startTime, currentService.duration);
    
    console.log("🔵 startTime:", startTime);
    console.log("🔵 endTime:", endTime);

    // For rescheduling
    if (isReschedule && rescheduleAppointment) {
      navigate("/payment", {
        state: {
          isReschedule: true,
          appointmentId: rescheduleAppointment._id,
          rescheduleData: {
            date,
            startTime,
            endTime,
            professionalId,
            slotIds: selectedSlot.slotIds || [selectedSlot._id].filter(Boolean),
          },
          service: currentService,
          professional: selectedProfessional,
          salon,
          selectedDate: date,
          selectedTime: startTime,
          totalAmount: totalAmount,
          amount: totalAmount
        }
      });
      return;
    }

    // ✅ CORRECTED: Send ONLY the fields backend expects
    const appointmentData = {
      salonId: salon?._id,
      professionalId: professionalId,
      serviceName: currentService.name,
      price: currentService.price,
      duration: currentService.duration,
      date: date,
      startTime: startTime
    };

    console.log("🔵 Final appointmentData:", appointmentData);
    console.log("🔵 salon:", salon);
    console.log("🔵 professionalId:", professionalId);
    console.log("🔵 currentService:", currentService);
    console.log("🔵 user:", user);

    try {
      console.log("📤 Creating appointment with data:", appointmentData);
      
      const createdAppointment = await createAppointment(appointmentData);
      console.log("✅ Appointment created successfully:", createdAppointment);

      navigateToConfirmation(createdAppointment);
    } catch (error) {
      console.error("❌ Appointment creation failed:", error);
      alert("❌ Failed to create appointment: " + error.message);
    }
  };

  // No services selected
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

  // Render
  return (
    <div className="select-services-container" key={renderKey}>
      <div className="left-column">
        <p className="breadcrumb">Services &gt; Professional &gt; <b>Time</b> &gt; Confirmation</p>
        <h2 className="heading-with-search">{isReschedule ? "Reschedule" : "Select Time for"} {currentService.name}</h2>

        {selectedServices.length > 1 && (
          <div className="service-progress">
            <p>Service {currentServiceIndex.current + 1} of {selectedServices.length}</p>
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

        {!professionalId && (
          <div style={{ padding: 12, background: "#fff3cd", color: "#856404", borderRadius: 8, margin: "12px 0" }}>
            <strong>No professional selected</strong>
          </div>
        )}

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
            <p>💇 {currentService.name}</p>
            <p>👤 {selectedProfessional?.name || "Any"}</p>
            {selectedTimes[serviceKey] && selectedDate && (
              <p>📅 {new Date(selectedDate).toDateString()} 🕒 {filteredSlots.find(s => (s._id === selectedTimes[serviceKey] || s.id === selectedTimes[serviceKey] || s.startTime === selectedTimes[serviceKey]))?.startTime}</p>
            )}
            
            {selectedServices.length > 1 && (
              <div className="services-breakdown">
                <p><strong>Services:</strong></p>
                {selectedServices.map((service, index) => (
                  <p key={index} style={{ fontSize: '0.9em', margin: '2px 0' }}>
                    {service.name}: LKR {service.price}
                  </p>
                ))}
              </div>
            )}
            
            <div className="total-section">
              <p>Total Amount</p>
              <p><strong>LKR {totalAmount}</strong></p>
            </div>
          </div>
          <button className="continue-button" onClick={handleContinue} disabled={!selectedTimes[serviceKey] || loading}>
            {loading ? "Processing..." : isReschedule ? "Continue to Payment" : "Confirm Booking"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loader">
            <div className="loader-dots"><div></div><div></div><div></div></div>
            <p>Processing your appointment...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectTimePage;
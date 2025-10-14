// SelectTimePage.jsx
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
  const [renderKey, setRenderKey] = useState(0); // force re-render when needed
  const [selectedDates, setSelectedDates] = useState({});
  const [selectedTimes, setSelectedTimes] = useState({});
  const [availableSlots, setAvailableSlots] = useState({}); // keyed by ${professionalId}-${date}
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);

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

  // ---------- helper: resolve professional id from many shapes ----------
  const resolveProfessionalId = (prof, currentServiceName) => {
    if (!prof) return null;

    // if it's a plain string id
    if (typeof prof === "string" && prof.trim()) return prof;

    // if prof is an object with _id
    if (prof._id) return prof._id;

    // if prof has nested professionalId (some payloads)
    if (prof.professionalId && typeof prof.professionalId === "string") return prof.professionalId;
    if (prof.professionalId && prof.professionalId._id) return prof.professionalId._id;

    // if prof is a mapping keyed by service name: { "Facial": { _id: ... }, ... }
    if (currentServiceName && prof[currentServiceName]) {
      if (typeof prof[currentServiceName] === "string") return prof[currentServiceName];
      if (prof[currentServiceName]._id) return prof[currentServiceName]._id;
    }

    // fallback: maybe the reschedule appointment has a professionalId (populated)
    if (rescheduleAppointment?.professionalId) {
      if (typeof rescheduleAppointment.professionalId === "string") return rescheduleAppointment.professionalId;
      if (rescheduleAppointment.professionalId._id) return rescheduleAppointment.professionalId._id;
    }

    return null;
  };

  // ---------- fetch time slots ----------
  const fetchTimeSlots = async (professionalId, date) => {
    if (!professionalId || !date) {
      console.warn("fetchTimeSlots called without professionalId or date", { professionalId, date });
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/timeslots?professionalId=${professionalId}&date=${date}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // store by key so we can fetch multiple dates without collisions
      const key = `${professionalId}-${date}`;
      setAvailableSlots(prev => ({ ...prev, [key]: Array.isArray(data) ? data : [] }));
      console.debug("Fetched slots", key, Array.isArray(data) ? data.length : typeof data);
    } catch (err) {
      console.error("Error fetching time slots:", err);
      const key = `${professionalId}-${date}`;
      setAvailableSlots(prev => ({ ...prev, [key]: [] }));
    }
  };

  // ---------- init: map reschedule appointment into state if provided ----------
  useEffect(() => {
    if (!isReschedule || !rescheduleAppointment) return;
    // set professional if appointment has it
    if (rescheduleAppointment.professionalId) {
      setSelectedProfessional(rescheduleAppointment.professionalId);
    }
    // map services shape
    if (rescheduleAppointment.services?.length) {
      const mapped = rescheduleAppointment.services.map(s => ({
        name: s.name,
        price: s.price,
        duration: s.duration || "30 minutes",
      }));
      setSelectedServices(mapped);
    }
  }, [isReschedule, rescheduleAppointment]);

  // ---------- when professional / services / index change, pick a default date & fetch slots ----------
  // Initialize selected date and fetch slots when professional changes
  useEffect(() => {
    if (!selectedProfessional || selectedServices.length === 0) return;
    
    const currentService = selectedServices[currentServiceIndex.current];
    if (!currentService) return;

    console.log("Selected Professional:", selectedProfessional); // Debug log
    console.log("Current Service:", currentService); // Debug log

    // Get the professional ID - handle different data structures
    let professionalId = null;
    
    // Case 1: Direct professional object with _id
    if (selectedProfessional._id) {
      professionalId = selectedProfessional._id;
      console.log("Professional ID from direct object:", professionalId);
    }
    // Case 2: Professional object nested under service name
    else if (selectedProfessional[currentService.name]?._id) {
      professionalId = selectedProfessional[currentService.name]._id;
      console.log("Professional ID from nested object:", professionalId);
    }
    // Case 3: Professional might be an array or have different structure
    else if (Array.isArray(selectedProfessional) && selectedProfessional.length > 0) {
      // Take the first professional if it's an array
      professionalId = selectedProfessional[0]?._id;
      console.log("Professional ID from array:", professionalId);
    }
    // Case 4: Check if professionalId is directly available
    else if (selectedProfessional.professionalId) {
      professionalId = selectedProfessional.professionalId;
      console.log("Professional ID from professionalId field:", professionalId);
    }
    // Case 5: Check if it's a string ID directly
    else if (typeof selectedProfessional === 'string') {
      professionalId = selectedProfessional;
      console.log("Professional ID as string:", professionalId);
    }

    if (!professionalId) {
      console.error("No professional ID found in selectedProfessional:", selectedProfessional);
      console.error("Available keys:", Object.keys(selectedProfessional));
      return;
    }

    // Set default date
    const defaultDate = isReschedule && rescheduleAppointment?.date 
      ? rescheduleAppointment.date 
      : dates[0]?.fullDate;

    if (defaultDate) {
      setSelectedDates((prev) => ({ ...prev, [currentService.name]: defaultDate }));
      setSelectedTimes((prev) => ({ ...prev, [currentService.name]: null }));
      
      // Fetch slots for the default date
      fetchTimeSlots(professionalId, defaultDate);
    }
  }, [selectedProfessional, selectedServices, isReschedule, rescheduleAppointment, dates]);

  // ---------- build derived values for rendering ----------
  const currentService = selectedServices[currentServiceIndex.current] || {};
  const serviceKey = currentService.name || "service";
  const professionalId = resolveProfessionalId(selectedProfessional, currentService.name);
  const selectedDate = selectedDates[serviceKey] || dates[0]?.fullDate;
  const slotKey = professionalId && selectedDate ? `${professionalId}-${selectedDate}` : null;
  const rawSlots = slotKey ? availableSlots[slotKey] : [];
  const safeSlots = Array.isArray(rawSlots) ? rawSlots : [];
  const filteredSlots = currentService.duration ? filterMatchingSlots(safeSlots, currentService.duration) : safeSlots;

  // ---------- when filteredSlots change and we're rescheduling try to auto-select ----------
  useEffect(() => {
    if (!isReschedule || !rescheduleAppointment) return;
    if (!currentService.name) return;
    if (!filteredSlots || filteredSlots.length === 0) return;

    const appointmentStart = rescheduleAppointment.startTime;
    if (!appointmentStart) return;

    // find a slot (or block) that matches appointmentStart
    const matching = filteredSlots.find(s => s.startTime === appointmentStart || s.start === appointmentStart || s._id === rescheduleAppointment.slotId || (s.slotIds && s.slotIds.includes(rescheduleAppointment.slotId)));
    if (matching && !matching.isBooked) {
      setSelectedTimes(prev => ({ ...prev, [serviceKey]: matching._id || matching.id || matching.startTime }));
    }
  }, [filteredSlots, isReschedule, rescheduleAppointment, serviceKey]);

  // ---------- handlers ----------
  const handleDateClick = (serviceName, profId, fullDate) => {
    setSelectedDates(prev => ({ ...prev, [serviceName]: fullDate }));
    setSelectedTimes(prev => ({ ...prev, [serviceName]: null }));
    fetchTimeSlots(profId, fullDate);
  };

  const handleTimeClick = (serviceName, slotId, isBooked) => {
    if (isBooked) return;
    setSelectedTimes(prev => ({ ...prev, [serviceName]: slotId }));
  };

  const handleContinue = () => {
    if (!selectedTimes[serviceKey]) {
      alert("❌ Please select a time for the current service.");
      return;
    }
    setShowPopup(true);
  };

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

  const handleConfirmBooking = async () => {
    if (!phone.trim()) {
      alert("Please enter your phone number");
      return;
    }

    const slotId = selectedTimes[serviceKey];
    const date = selectedDates[serviceKey];
    const selectedSlot = filteredSlots.find(s => (s._id && s._id === slotId) || (s.id && s.id === slotId) || (s.startTime && s.startTime === slotId));

    if (!selectedSlot) {
      alert("Selected slot not available. Please pick another time.");
      return;
    }

    const startTime = selectedSlot.startTime || selectedSlot.start;
    const endTime = computeEndFromStartAndDuration(startTime, currentService.duration);

    // reschedule
    if (isReschedule && rescheduleAppointment) {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:5000/api/appointments/${rescheduleAppointment._id}/reschedule`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            startTime,
            endTime,
            professionalId,
            slotIds: selectedSlot.slotIds || [selectedSlot._id].filter(Boolean),
          }),
        });
        const data = await res.json();

        setTimeout(() => {
          setLoading(false);
          setShowPopup(false);
          if (data.success) {
            alert("✅ Appointment rescheduled!");
            navigate("/appointments");
          } else {
            alert("❌ Failed to reschedule appointment: " + (data.message || "Unknown error"));
          }
        }, 700);
      } catch (err) {
        console.error(err);
        setLoading(false);
        alert("❌ Something went wrong while rescheduling.");
      }
      return;
    }

    // normal booking
    const appointment = {
      phone,
      email: user?.email || "",
      name: user?.name || "Guest",
      appointments: [
        {
          serviceName: currentService.name,
          price: currentService.price,
          duration: currentService.duration,
          date,
          startTime,
          endTime,
          professionalId: professionalId,
          salonId: salon?._id,
          slotIds: selectedSlot.slotIds || [selectedSlot._id].filter(Boolean),
        },
      ],
    };

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointment),
      });
      const data = await res.json();

      setTimeout(() => {
        setLoading(false);
        setShowPopup(false);

        if (data.success) {
          if (currentServiceIndex.current + 1 < selectedServices.length) {
            currentServiceIndex.current += 1;
            // force re-render so UI shows next service
            setRenderKey(k => k + 1);
          } else {
            navigate("/appointments");
          }
        } else {
          alert("❌ Failed to book appointment.");
        }
      }, 1000);
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("❌ Something went wrong.");
    }
  };

  // if no services
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

  // ---------- render ----------
  return (
    <div className="select-services-container" key={renderKey}>
      <div className="left-column">
        <p className="breadcrumb">Services &gt; Professional &gt; <b>Time</b> &gt; Confirm</p>
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

        {/* helpful debug if professionalId is missing */}
        {!professionalId && (
          <div style={{ padding: 12, background: "#fff3cd", color: "#856404", borderRadius: 8, margin: "12px 0" }}>
            <strong>No professional selected</strong><br />
            Check that selectedProfessional is passed correctly. Console debug:
            <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
              {JSON.stringify(selectedProfessional, null, 2)}
            </pre>
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
            <div className="total-section">
              <p>Total</p>
              <p><strong>LKR {currentService.price}</strong></p>
            </div>
          </div>
          <button className="continue-button" onClick={handleContinue} disabled={!selectedTimes[serviceKey]}>
            {isReschedule ? "Continue to reschedule" : "Continue"}
          </button>
        </div>
      </div>

      {showPopup && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>{isReschedule ? "Confirm Reschedule" : "Confirm Booking"}</h3>
            <p>Enter your phone number to confirm:</p>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="Enter your phone" />
            <button className="continue-button" onClick={handleConfirmBooking}>{isReschedule ? "Confirm Reschedule" : "Confirm Booking"}</button>
            <button className="cancel-button" onClick={() => setShowPopup(false)}>Cancel</button>
          </div>
        </div>
      )}

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
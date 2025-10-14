import React, { useEffect, useState } from "react";
import "../css/MyAppointmentsPage.css";
import { useNavigate } from "react-router-dom";

const MyAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [rating, setRating] = useState(0);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  // fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/appointments?email=${user?.email}`
        );
        const data = await res.json();
        setAppointments(data);
      } catch (err) {
        console.error("Failed to fetch appointments", err);
      }
    };

    if (user?.email) {
      fetchAppointments();
    }
  }, [user]);

  // cancel appointment
  const handleCancel = async (id) => {
    const confirm = window.confirm("Are you sure you want to cancel?");
    if (!confirm) return;

    try {
      await fetch(`http://localhost:5000/api/appointments/${id}`, {
        method: "DELETE",
      });
      setAppointments((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      alert("Cancel failed");
    }
  };

  const handleReschedule = (appointment) => {
    // Prepare data for rescheduling
    const rescheduleData = {
      appointmentId: appointment._id,
      selectedServices: appointment.services.map(service => ({
        name: service.name,
        price: service.price,
        duration: service.duration
      })),
      selectedProfessional: appointment.professionalId,
      salon: appointment.salonId,
      isReschedule: true
    };

    // Store in localStorage for the SelectTimePage to access
    localStorage.setItem("rescheduleData", JSON.stringify(rescheduleData));
    
    // Navigate to SelectTimePage
    navigate("/select-time", { state: rescheduleData });
  };

  // open popup
  const openFeedbackPopup = (appointment) => {
    setSelectedAppointment(appointment);
    setShowPopup(true);
  };

  // submit feedback
const submitFeedback = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId: selectedAppointment._id,
        salonId: selectedAppointment.salonId._id,
        professionalId: selectedAppointment.professionalId, // ✅ ADD THIS LINE
        userEmail: user.email,
        rating,
        comment: feedbackText,
      }),
    });

    if (!res.ok) {
      alert("Failed to submit feedback");
      return;
    }

    setShowPopup(false);
    setFeedbackText("");
    setRating(0);

    alert("Feedback submitted!");

    navigate("/select-professional", {
      state: {
        salon: selectedAppointment.salonId,
        selectedServices: selectedAppointment.services,
      },
    });
  } catch (err) {
    alert("Error occurred while submitting feedback");
  }
};


  return (
    <div className="appointment-page-wrapper">
      <aside className="sidebar">
        <div className="logo" onClick={() => navigate("/", { replace: true })}>
          Salon
        </div>
        <div className="user-name">{user?.name}</div>
        <nav>
          <button
            className="nav-btn"
            onClick={() => navigate("/profile", { replace: true })}
          >
            👤 Profile
          </button>
          <button className="nav-btn active">📅 Appointments</button>
          <button
            className="nav-btn logout"
            onClick={() => {
              localStorage.clear();
              navigate("/login", { replace: true });
            }}
          >
            Log out
          </button>
        </nav>
      </aside>

      <div className="appointment-content">
        <button
          className="back-btn"
          onClick={() => navigate("/", { replace: true })}
        >
          ← Back
        </button>

        <h2>📋 My Appointments</h2>
        {appointments.length === 0 ? (
          <p className="no-data">No appointments found.</p>
        ) : (
          appointments.map((a) => (
            <div className="appointment-card" key={a._id}>
              <div className="appointment-top">
                <img
                  src={
                    a.salonId?.image
                      ? a.salonId.image.startsWith("http")
                        ? a.salonId.image
                        : `http://localhost:5000/uploads/${a.salonId.image}`
                      : "https://via.placeholder.com/100"
                  }
                  alt={a.salonId?.name || "Salon"}
                />
                <div className="salon-info">
                  <h4>{a.salonId?.name}</h4>
                  <p>📍 {a.salonId?.location}</p>
                  <p className="appt-date">
                    📅{" "}
                    {new Date(a.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                  <p className="appt-time">
                    🕒{" "}
                    {a.startTime && a.endTime
                      ? `${a.startTime} – ${a.endTime}`
                      : "Time pending"}
                  </p>
                  <p className="appt-status">
                    🔖 <strong>Status:</strong>{" "}
                    <span
                      className={
                        a.status === "confirmed"
                          ? "status-confirmed"
                          : a.status === "completed"
                          ? "status-completed"
                          : "status-pending"
                      }
                    >
                      {a.status || "Pending"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="service-info">
                {a.services.map((s, i) => (
                  <div key={i} className="service-row">
                    <span>🧾 {s.name}</span>
                    <span>LKR {s.price}</span>
                  </div>
                ))}
                <div className="total-row">
                  <strong>Total</strong>
                  <strong>
                    LKR {a.services.reduce((total, s) => total + s.price, 0)}
                  </strong>
                </div>
              </div>

              <div className="action-buttons">
                <button
                      className="reschedule-btn"
                      onClick={() => handleReschedule(a)}
                    >
                      🔁 Reschedule
                    </button>
                <button
                  className="add-review-btn"
                  onClick={() => openFeedbackPopup(a)}
                >
                  📝 Add Review

                </button>
                {a.status?.toLowerCase() !== "completed" && (
                  <button
                    className="cancel-btn"
                    onClick={() => handleCancel(a._id)}
                  >
                    ❌ Cancel
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Rate {selectedAppointment?.salonId?.name}</h3>
            <textarea
              placeholder="Your feedback..."
              rows={4}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            ></textarea>
            <div style={{ display: "flex", gap: 5 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  style={{
                    fontSize: 24,
                    color: star <= rating ? "#ff9800" : "#ccc",
                    cursor: "pointer",
                  }}
                  onClick={() => setRating(star)}
                >
                  ★
                </span>
              ))}
            </div>
            <div className="popup-actions">
              <button className="btn-cancel" onClick={() => setShowPopup(false)}>
                Cancel
              </button>
              <button className="btn-save" onClick={submitFeedback}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointmentsPage;

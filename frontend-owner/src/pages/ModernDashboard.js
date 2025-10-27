import React, { useEffect, useState, useRef } from 'react';
import '../css/Dashboard.css';
import logo from '../assets/logo.png';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';

// ✅ Sidebar component
const Sidebar = () => {
  const navigate = useNavigate();

  return (
    <aside className="modern-sidebar">
      <img src={logo} alt="Brand Logo" className="modern-logo" />
      <i className="fas fa-home active" title="Home" onClick={() => navigate('/dashboard')}></i>
      <i className="fas fa-calendar-alt" title="Calendar" onClick={() => navigate('/calendar')}></i>
      <i className="fas fa-smile" title="Services" onClick={() => navigate('/services')}></i>
      <i className="fas fa-comment" title="Feedbacks" onClick={() => navigate('/feedbacks')}></i>
      <i className="fas fa-users" title="Professionals" onClick={() => navigate('/professionals')}></i>
      <i className="fas fa-clock" title="Time Slots" onClick={() => navigate('/timeslots')}></i>
    </aside>
  );
};

// ✅ Format functions
const formatDate = (dateStr) => dayjs(dateStr).format('ddd, DD MMM YYYY');

const formatTimeRange = (start, end) => {
  if (!start || !end) return "Time pending";
  const s = dayjs(`2000-01-01T${start}`);
  const e = dayjs(`2000-01-01T${end}`);
  return `${s.format("h:mm A")} – ${e.format("h:mm A")}`;
};

// ✅ Main Dashboard component
const ModernDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [salon, setSalon] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef();
  const navigate = useNavigate();

  // ✅ Logout function
  const handleLogout = () => {
    const confirmLogout = window.confirm("Do you really want to logout?");
    if (confirmLogout) {
      localStorage.removeItem("salonUser");
      navigate("/"); // redirect to login page
    }
  };

  // ✅ Show confirmation when user tries to refresh/back
  useEffect(() => {
    const beforeUnloadHandler = (e) => {
      e.preventDefault();
      e.returnValue = "Do you really want to logout?";
    };
    window.addEventListener("beforeunload", beforeUnloadHandler);
    return () => {
      window.removeEventListener("beforeunload", beforeUnloadHandler);
    };
  }, []);

  // ✅ Close notification dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Fetch salon data and appointments
  useEffect(() => {
    const salonData = JSON.parse(localStorage.getItem("salonUser"));
    if (!salonData?.id) return;
    setSalon(salonData);

    const fetchAppointments = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/appointments/salon/${salonData.id}`);
        const all = res.data;

        const today = dayjs().format("YYYY-MM-DD");

        const todayList = all.filter(a => a.date === today);
        const upcomingList = all.filter(a => dayjs(a.date).isAfter(today));

        setAppointments(all);
        setTodayAppointments(todayList);
        setUpcomingAppointments(upcomingList);
      } catch (err) {
        console.error("Failed to fetch appointments", err);
      }
    };

    fetchAppointments();
  }, []);

  const salonId = salon?.id;

  return (
    <div className="modern-full-page">
      <div className="modern-layout">
        <Sidebar />

        {/* Main Content */}
        <main className="modern-main-content">
          {/* Header */}
          <header className="modern-header">
            <h2>Salon Dashboard</h2>
            <div className="modern-header-right" ref={notifRef}>
              {/* Notification Bell */}
              <div className="notif-wrapper">
                <i
                  className="fas fa-bell"
                  title="Notifications"
                  style={{ position: "relative", cursor: "pointer" }}
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  {appointments.filter(a => a.status.toLowerCase() === "pending").length > 0 && (
                    <span className="notif-count">
                      {appointments.filter(a => a.status.toLowerCase() === "pending").length}
                    </span>
                  )}
                </i>

                {showNotifications && (
                  <div className="notif-dropdown">
                    {appointments.filter(a => a.status.toLowerCase() === "pending").length === 0 ? (
                      <p className="notif-empty">No pending appointments</p>
                    ) : (
                      appointments
                        .filter(a => a.status.toLowerCase() === "pending")
                        .map(appt => (
                          <div key={appt._id} className="notif-item">
                            <div>
                              <strong>{appt.user?.name}</strong> - {appt.services[0]?.name} <br />
                              {formatDate(appt.date)} · {formatTimeRange(appt.startTime, appt.endTime)}
                            </div>
                            <button
                              className="notif-read-btn"
                              onClick={async () => {
                                try {
                                  await axios.patch(`http://localhost:5000/api/appointments/${appt._id}/status`, { status: "read" });
                                  setAppointments(prev =>
                                    prev.map(a => a._id === appt._id ? { ...a, status: "read" } : a)
                                  );
                                } catch (err) {
                                  console.error("Failed to mark as read:", err);
                                  alert("Error marking appointment as read");
                                }
                              }}
                            >
                              Mark as read
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                )}
              </div>

              {/* Profile image clickable to Salon Profile */}
              {salonId && (
                <Link to={`/profile/${salonId}`}>
                  <img
                    src={
                      salon.image
                        ? salon.image.startsWith("http")
                          ? salon.image
                          : `http://localhost:5000/uploads/${salon.image}`
                        : "https://via.placeholder.com/35"
                    }
                    alt="Profile"
                    className="modern-profile"
                    style={{ borderRadius: "50%", cursor: "pointer" }}
                  />
                </Link>
              )}

              {/* Logout Button */}
              <button
                className="logout-btn"
                onClick={handleLogout}
                style={{
                  marginLeft: "15px",
                  padding: "5px 12px",
                  background: "#e74c3c",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
                title="Logout"
              >
                Logout
              </button>
            </div>
          </header>

          {/* Content */}
          <section className="modern-content-area">
            {/* All Appointments */}
            <div className="modern-appointments">
              <h3>Appointment Activity</h3>
              {appointments.length === 0 && <p>No appointments found.</p>}

              {appointments.map((appt) => (
                <div key={appt._id} className="modern-card">
                  <div className="modern-left">
                    <span><strong>{dayjs(appt.date).format("DD")}</strong> {dayjs(appt.date).format("MMM")}</span>
                    <h4>{appt.services[0]?.name}</h4>
                    <small>{formatDate(appt.date)} · {formatTimeRange(appt.startTime, appt.endTime)}</small>
                    <small>{appt.services[0]?.duration} · {appt.user?.name}</small>
                    <span className={`modern-tag modern-${appt.status?.toLowerCase()}`}>
                      {appt.status}
                    </span>
                  </div>
                  <div className="modern-right">
                    <strong>LKR {appt.services[0]?.price}</strong>
                  </div>
                </div>
              ))}
            </div>

            {/* Today Appointments */}
            <div className="modern-today">
              <h3>Today's Appointments</h3>
              {todayAppointments.length === 0 ? (
                <div className="modern-empty">
                  <i className="fas fa-clock"></i>
                  <h4>No Appointments Today</h4>
                  <p>
                    Visit the <a href="/calendar">calendar</a> section to schedule appointments.
                  </p>
                </div>
              ) : (
                todayAppointments.map((appt) => (
                  <div key={appt._id} className="modern-card">
                    <div className="modern-left">
                      <h4>{appt.services[0]?.name}</h4>
                      <small>{formatTimeRange(appt.startTime, appt.endTime)} · {appt.user?.name}</small>
                    </div>
                    <div className="modern-right">
                      <strong>LKR {appt.services[0]?.price}</strong>
                    </div>
                  </div>
                ))
              )}

              <hr />

              {/* Upcoming */}
              <h3>Upcoming Appointments</h3>
              {upcomingAppointments.length === 0 ? (
                <div className="modern-empty">
                  <i className="fas fa-calendar-times"></i>
                  <h4>No Upcoming Appointments</h4>
                  <p>Once you create appointments, they will appear here.</p>
                </div>
              ) : (
                upcomingAppointments.map((appt) => (
                  <div key={appt._id} className="modern-card">
                    <div className="modern-left">
                      <h4>{appt.services[0]?.name}</h4>
                      <small>{formatDate(appt.date)} · {formatTimeRange(appt.startTime, appt.endTime)}</small>
                      <small>{appt.user?.name}</small>
                    </div>
                    <div className="modern-right">
                      <strong>LKR {appt.services[0]?.price}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default ModernDashboard;
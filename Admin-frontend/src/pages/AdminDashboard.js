import React, { useEffect, useState, useRef } from 'react';
import '../css/AdminDashboard.css';
import logo from '../assets/logo.png';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';

// Enhanced Sidebar with Admin Features
const AdminSidebar = () => {
  const navigate = useNavigate();

  return (
    <aside className="admin-sidebar">
      <img src={logo} alt="Brand Logo" className="admin-logo" />
      <div className="sidebar-section" style={{ gap: 6 }}>
        <div className="sidebar-link active" onClick={() => navigate('/admin-dashboard')} title="Dashboard">
          <i className="fas fa-home"></i>
          <span>Dashboard</span>
        </div>
        <div className="sidebar-link" onClick={() => navigate('/customers')} title="Client">
          <i className="fas fa-users"></i>
          <span>Client</span>
        </div>
        <div className="sidebar-link" onClick={() => navigate('/calendar')} title="Booking">
          <i className="fas fa-calendar-check"></i>
          <span>Booking</span>
        </div>
        <div className="sidebar-link" onClick={() => navigate('/professionals')} title="Staff">
          <i className="fas fa-user-tie"></i>
          <span>Staff</span>
        </div>
        <div className="sidebar-link" onClick={() => navigate('/services')} title="Services">
          <i className="fas fa-concierge-bell"></i>
          <span>Services</span>
        </div>
        <div className="sidebar-link" onClick={() => navigate('/promotions')} title="Promotions">
          <i className="fas fa-bullhorn"></i>
          <span>Promotions</span>
        </div>
      </div>
    </aside>
  );
};

// Analytics Cards Component
const AnalyticsCard = ({ title, value, icon, color, trend, subtitle }) => (
  <div className="analytics-card">
    <div className="card-header">
      <i className={`fas ${icon} ${color}`}></i>
      <span className="trend">{trend}</span>
    </div>
    <div className="card-content">
      <h3>{value}</h3>
      <p>{title}</p>
      {subtitle && <small>{subtitle}</small>}
    </div>
  </div>
);

// Recent Activity Component
const RecentActivity = ({ activities }) => (
  <div className="recent-activity">
    <h3>Recent Activity</h3>
    <div className="activity-list">
      {activities.map((activity, index) => (
        <div key={index} className="activity-item">
          <div className="activity-icon">
            <i className={`fas ${activity.icon}`}></i>
          </div>
          <div className="activity-content">
            <p>{activity.description}</p>
            <small>{activity.time}</small>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Quick Actions Component
const QuickActions = () => {
  const navigate = useNavigate();
  const actions = [
    { title: 'New Booking', desc: 'Create an appointment', icon: 'fa-calendar-plus', color: 'blue', onClick: () => navigate('/calendar') },
    { title: 'Add Client', desc: 'Register a new client', icon: 'fa-user-plus', color: 'green', onClick: () => navigate('/customers') },
    { title: 'Add Staff', desc: 'Create staff profile', icon: 'fa-user-tie', color: 'purple', onClick: () => navigate('/professionals') },
    { title: 'Add Service', desc: 'Create a new service', icon: 'fa-concierge-bell', color: 'orange', onClick: () => navigate('/services') },
    { title: 'Promotions', desc: 'Create a campaign', icon: 'fa-bullhorn', color: 'pink', onClick: () => navigate('/promotions') },
    { title: 'Reports', desc: 'View analytics', icon: 'fa-chart-line', color: 'teal', onClick: () => navigate('/reports') },
  ];

  return (
    <div className="quick-actions">
      <h3>Quick Actions</h3>
      <div className="qa-grid">
        {actions.map((a) => (
          <button key={a.title} className="qa-card" onClick={a.onClick}>
            <span className={`qa-icon ${a.color}`}>
              <i className={`fa-solid ${a.icon}`}></i>
            </span>
            <span className="qa-info">
              <strong>{a.title}</strong>
              <small>{a.desc}</small>
            </span>
            <i className="fa-solid fa-chevron-right qa-chevron"></i>
          </button>
        ))}
      </div>
    </div>
  );
};

// Main Admin Dashboard Component
const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    totalRevenue: 0,
    activeCustomers: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    totalServices: 0,
    totalProfessionals: 0
  });
  
  const [recentActivities, setRecentActivities] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [salon, setSalon] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef();
  const navigate = useNavigate();

  // Logout function
  const handleLogout = () => {
    const confirmLogout = window.confirm("Do you really want to logout?");
    if (confirmLogout) {
      localStorage.removeItem("salonUser");
      navigate("/");
    }
  };

  // Function to load salon data
  const loadSalonData = () => {
    const salonData = JSON.parse(localStorage.getItem("salonUser"));
    if (salonData?.id) {
      setSalon(salonData);
      return salonData;
    }
    return null;
  };

  // Fetch dashboard data
  useEffect(() => {
    const salonData = loadSalonData();
    if (!salonData) return;

    const fetchDashboardData = async () => {
      try {
        // Fetch appointments
        const appointmentsRes = await axios.get(`http://localhost:5000/api/appointments/salon/${salonData.id}`);
        const appointments = appointmentsRes.data;
        
        // Fetch services
        const servicesRes = await axios.get(`http://localhost:5000/api/services/salon/${salonData.id}`);
        const services = servicesRes.data;
        
        // Fetch professionals
        const professionalsRes = await axios.get(`http://localhost:5000/api/professionals/salon/${salonData.id}`);
        const professionals = professionalsRes.data;

        // Calculate analytics
        const today = dayjs().format("YYYY-MM-DD");
        const todayAppointments = appointments.filter(a => a.date === today);
        const pendingAppointments = appointments.filter(a => a.status.toLowerCase() === "pending");
        const completedAppointments = appointments.filter(a => a.status.toLowerCase() === "completed");
        
        const totalRevenue = appointments.reduce((sum, appt) => {
          return sum + (appt.services[0]?.price || 0);
        }, 0);

        // Get unique customers
        const uniqueCustomers = new Set(appointments.map(a => a.user?._id)).size;

        setDashboardData({
          totalAppointments: appointments.length,
          todayAppointments: todayAppointments.length,
          totalRevenue,
          activeCustomers: uniqueCustomers,
          pendingAppointments: pendingAppointments.length,
          completedAppointments: completedAppointments.length,
          totalServices: services.length,
          totalProfessionals: professionals.length
        });

        setAppointments(appointments);

        // Generate recent activities
        const activities = [
          {
            icon: 'fa-calendar-plus',
            description: `New appointment scheduled for ${appointments[0]?.user?.name || 'Customer'}`,
            time: '2 minutes ago'
          },
          {
            icon: 'fa-user-check',
            description: 'Professional added to the system',
            time: '1 hour ago'
          },
          {
            icon: 'fa-concierge-bell',
            description: 'New service added to catalog',
            time: '3 hours ago'
          },
          {
            icon: 'fa-comment',
            description: 'Customer feedback received',
            time: '5 hours ago'
          }
        ];
        setRecentActivities(activities);

        // Generate notifications
        const notifications = [
          {
            id: 1,
            type: 'appointment',
            message: `${pendingAppointments.length} pending appointments need attention`,
            time: 'Just now',
            priority: 'high'
          },
          {
            id: 2,
            type: 'feedback',
            message: 'New customer feedback received',
            time: '10 minutes ago',
            priority: 'medium'
          },
          {
            id: 3,
            type: 'system',
            message: 'System backup completed successfully',
            time: '1 hour ago',
            priority: 'low'
          }
        ];
        setNotifications(notifications);

      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      }
    };

    fetchDashboardData();
  }, []);

  // Refresh salon data when page becomes visible (e.g., returning from profile page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadSalonData();
      }
    };

    const handleFocus = () => {
      loadSalonData();
    };

    const handleSalonProfileUpdated = (event) => {
      // Update salon data when profile is updated
      if (event.detail?.updatedData) {
        setSalon(event.detail.updatedData);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('salonProfileUpdated', handleSalonProfileUpdated);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('salonProfileUpdated', handleSalonProfileUpdated);
    };
  }, []);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle quick actions
  const handleQuickAction = (action) => {
    switch (action) {
      case 'add-appointment':
        navigate('/calendar');
        break;
      case 'add-service':
        navigate('/services');
        break;
      case 'add-professional':
        navigate('/professionals');
        break;
      case 'view-reports':
        navigate('/reports');
        break;
      default:
        break;
    }
  };

  const salonId = salon?.id;

  return (
    <div className="admin-full-page">
      <div className="admin-layout">
        <AdminSidebar />

        {/* Main Content */}
        <main className="admin-main-content">
          {/* Header */}
          <header className="admin-header">
            <div className="header-left">
              <h1>Admin Dashboard</h1>
              <p>Welcome back: {salon?.name || 'Salon Owner'}</p>
            </div>
            <div className="admin-header-right" ref={notifRef}>
              {/* Notification Bell */}
              <div className="notif-wrapper">
                <i
                  className="fas fa-bell"
                  title="Notifications"
                  style={{ position: "relative", cursor: "pointer" }}
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  {notifications.length > 0 && (
                    <span className="notif-count">{notifications.length}</span>
                  )}
                </i>

                {showNotifications && (
                  <div className="notif-dropdown">
                    {notifications.length === 0 ? (
                      <p className="notif-empty">No notifications</p>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className={`notif-item ${notif.priority}`}>
                          <div>
                            <strong>{notif.message}</strong>
                            <br />
                            <small>{notif.time}</small>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Profile image */}
              {salonId && (
                <Link to={`/profile/${salonId}`}>
                  <img
                    src={
                      salon?.image
                        ? salon.image.startsWith("http")
                          ? salon.image
                          : `http://localhost:5000/uploads/${salon.image}`
                        : "https://via.placeholder.com/35"
                    }
                    alt="Profile"
                    className="admin-profile"
                  />
                </Link>
              )}

              {/* Logout Button */}
              <button className="logout-btn" onClick={handleLogout}>
                <i className="fa-solid fa-right-from-bracket"></i>
                Logout
              </button>
            </div>
          </header>

          {/* Analytics Cards */}
          <section className="analytics-section">
            <AnalyticsCard
              title="Total Appointments"
              value={dashboardData.totalAppointments}
              icon="fa-calendar-check"
              color="blue"
              trend="+12%"
              subtitle="This month"
            />
            <AnalyticsCard
              title="Today's Appointments"
              value={dashboardData.todayAppointments}
              icon="fa-calendar-day"
              color="green"
              trend="+5%"
              subtitle="vs yesterday"
            />
            <AnalyticsCard
              title="Total Revenue"
              value={`LKR ${dashboardData.totalRevenue.toLocaleString()}`}
              icon="fa-dollar-sign"
              color="purple"
              trend="+18%"
              subtitle="This month"
            />
            <AnalyticsCard
              title="Active Customers"
              value={dashboardData.activeCustomers}
              icon="fa-users"
              color="orange"
              trend="+8%"
              subtitle="Regular clients"
            />
          </section>

          {/* Main Content Grid */}
          <section className="admin-content-grid">
            {/* Quick Actions */}
            <QuickActions />

            {/* Recent Activity */}
            <RecentActivity activities={recentActivities} />

            {/* Today's Appointments */}
            <div className="today-appointments">
              <h3>Today's Appointments</h3>
              {appointments.filter(a => a.date === dayjs().format("YYYY-MM-DD")).length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-calendar-times"></i>
                  <p>No appointments scheduled for today</p>
                </div>
              ) : (
                <div className="appointments-list">
                  {appointments
                    .filter(a => a.date === dayjs().format("YYYY-MM-DD"))
                    .map(appt => (
                      <div key={appt._id} className="appointment-item">
                        <div className="appointment-time">
                          {dayjs(`2000-01-01T${appt.startTime}`).format("h:mm A")}
                        </div>
                        <div className="appointment-details">
                          <h4>{appt.services[0]?.name}</h4>
                          <p>{appt.user?.name}</p>
                          <span className={`status ${appt.status.toLowerCase()}`}>
                            {appt.status}
                          </span>
                        </div>
                        <div className="appointment-price">
                          LKR {appt.services[0]?.price}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* System Status */}
            <div className="system-status">
              <h3>System Status</h3>
              <div className="status-items">
                <div className="status-item">
                  <i className="fas fa-server status-good"></i>
                  <span>Server Online</span>
                </div>
                <div className="status-item">
                  <i className="fas fa-database status-good"></i>
                  <span>Database Connected</span>
                </div>
                <div className="status-item">
                  <i className="fas fa-shield-alt status-good"></i>
                  <span>Security Active</span>
                </div>
                <div className="status-item">
                  <i className="fas fa-backup status-warning"></i>
                  <span>Backup Pending</span>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

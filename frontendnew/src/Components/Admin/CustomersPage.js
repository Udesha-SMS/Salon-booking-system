import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../../Assets/logo.png';
import './CustomersPage.css';

const CustomersPage = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [customerAppointments, setCustomerAppointments] = useState([]);

  // Fetch customers with appointment data
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        // Fetch all users from the database
        const usersRes = await axios.get('http://localhost:5000/api/users');
        const users = usersRes.data;

        // Fetch all appointments to calculate booking stats
        const salonsRes = await axios.get('http://localhost:5000/api/salons');
        const salons = salonsRes.data;

        const appointmentPromises = salons.map(salon =>
          axios.get(`http://localhost:5000/api/appointments/salon/${salon._id}`)
            .then(res => res.data)
            .catch(() => [])
        );

        const allSalonAppointments = await Promise.all(appointmentPromises);
        const allAppointments = allSalonAppointments.flat();

        // Create customer map with booking data
        const customerMap = new Map();
        
        // Add all registered users first
        users.forEach(user => {
          customerMap.set(user._id, {
            _id: user._id,
            name: user.name || 'Unknown',
            email: user.email || 'N/A',
            phone: user.phone || 'N/A',
            gender: user.gender || 'N/A',
            photoURL: user.photoURL || null,
            address: user.address || [],
            bookings: 0,
            totalSpent: 0,
            lastBooking: null,
            isRegistered: true
          });
        });

        // Add booking data
        allAppointments.forEach(appointment => {
          const customer = appointment.user;
          if (customer && customer._id) {
            if (!customerMap.has(customer._id)) {
              // Guest customer (not registered)
              customerMap.set(customer._id, {
                _id: customer._id,
                name: customer.name || 'Guest',
                email: customer.email || 'N/A',
                phone: 'N/A',
                gender: 'N/A',
                photoURL: null,
                address: [],
                bookings: 0,
                totalSpent: 0,
                lastBooking: null,
                isRegistered: false
              });
            }
            
            const customerData = customerMap.get(customer._id);
            customerData.bookings++;
            customerData.totalSpent += appointment.services?.[0]?.price || 0;
            
            // Track last booking date
            const appointmentDate = new Date(appointment.date);
            if (!customerData.lastBooking || appointmentDate > new Date(customerData.lastBooking)) {
              customerData.lastBooking = appointment.date;
            }
          }
        });

        // Convert to array and sort by bookings
        const customersArray = Array.from(customerMap.values());
        customersArray.sort((a, b) => b.bookings - a.bookings);

        setCustomers(customersArray);
        console.log(`✅ Loaded ${customersArray.length} customers`);
      } catch (err) {
        console.error('❌ Error loading customers:', err);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  // Filter customers by search
  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // View customer details
  const handleViewDetails = async (customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
    
    // Fetch customer's appointments
    try {
      const salonsRes = await axios.get('http://localhost:5000/api/salons');
      const salons = salonsRes.data;
      
      const appointmentPromises = salons.map(salon =>
        axios.get(`http://localhost:5000/api/appointments/salon/${salon._id}`)
          .then(res => res.data.filter(apt => apt.user?._id === customer._id))
          .catch(() => [])
      );
      
      const allAppointments = await Promise.all(appointmentPromises);
      setCustomerAppointments(allAppointments.flat());
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setCustomerAppointments([]);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="admin-full-page">
      <div className="admin-layout">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <img src={logo} alt="Brand Logo" className="admin-logo" />
          <div className="sidebar-section" style={{ gap: 6 }}>
            <div className="sidebar-link" onClick={() => navigate('/admin-dashboard')}>
              <i className="fas fa-home"></i>
              <span>Dashboard</span>
            </div>
            <div className="sidebar-link" onClick={() => navigate('/salons')}>
              <i className="fas fa-store"></i>
              <span>Salons</span>
            </div>
            <div className="sidebar-link" onClick={() => navigate('/admincalendar')}>
              <i className="fas fa-calendar-check"></i>
              <span>Booking</span>
            </div>
            <div className="sidebar-link active" onClick={() => navigate('/customers')}>
              <i className="fas fa-users"></i>
              <span>Customers</span>
            </div>
            <div className="sidebar-link" onClick={() => navigate('/feedback')}>
              <i className="fas fa-comments"></i>
              <span>Feedback</span>
            </div>
            <div className="sidebar-link" onClick={() => navigate('/promotions')}>
              <i className="fas fa-bullhorn"></i>
              <span>Promotions</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="admin-main-content">
          <div className="customers-container">
            {/* Header */}
            <div className="customers-header">
              <h1 className="page-title">
                <i className="fas fa-users"></i> Customers Management
              </h1>
              <div className="header-stats">
                <div className="stat-box">
                  <span className="stat-label">Total Customers</span>
                  <span className="stat-value">{customers.length}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Registered</span>
                  <span className="stat-value">{customers.filter(c => c.isRegistered).length}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Guests</span>
                  <span className="stat-value">{customers.filter(c => !c.isRegistered).length}</span>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="search-bar">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Customers Table */}
            <div className="customers-table-container">
              <table className="customers-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Gender</th>
                    <th>Last Booking</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="no-data">
                        <i className="fas fa-spinner fa-spin"></i> Loading customers...
                      </td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-data">
                        <i className="fas fa-user-slash"></i> No customers found
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <tr key={customer._id}>
                        <td className="customer-info">
                          {customer.photoURL ? (
                            <img src={customer.photoURL} alt={customer.name} className="customer-avatar" />
                          ) : (
                            <div className="customer-avatar-placeholder">
                              {customer.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                          )}
                          <span className="customer-name">{customer.name}</span>
                        </td>
                        <td>{customer.email}</td>
                        <td>{customer.phone}</td>
                        <td>
                          <span className={`gender-badge ${customer.gender?.toLowerCase()}`}>
                            {customer.gender === 'N/A' ? '-' : customer.gender}
                          </span>
                        </td>
                        <td>{formatDate(customer.lastBooking)}</td>
                        <td>
                          {customer.isRegistered ? (
                            <span className="status-badge registered">
                              <i className="fas fa-check-circle"></i> Registered
                            </span>
                          ) : (
                            <span className="status-badge guest">
                              <i className="fas fa-user-clock"></i> Guest
                            </span>
                          )}
                        </td>
                        <td>
                          <button 
                            className="view-details-btn"
                            onClick={() => handleViewDetails(customer)}
                          >
                            <i className="fas fa-eye"></i> View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Customer Details Modal */}
      {showModal && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <i className="fas fa-user-circle"></i> Customer Details
              </h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="customer-profile">
                {selectedCustomer.photoURL ? (
                  <img src={selectedCustomer.photoURL} alt={selectedCustomer.name} className="profile-photo" />
                ) : (
                  <div className="profile-photo-placeholder">
                    {selectedCustomer.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <div className="profile-info">
                  <h3>{selectedCustomer.name}</h3>
                  <p><i className="fas fa-envelope"></i> {selectedCustomer.email}</p>
                  <p><i className="fas fa-phone"></i> {selectedCustomer.phone}</p>
                  <p><i className="fas fa-venus-mars"></i> {selectedCustomer.gender}</p>
                  {selectedCustomer.address && selectedCustomer.address.length > 0 && (
                    <p><i className="fas fa-map-marker-alt"></i> {selectedCustomer.address[0].text}</p>
                  )}
                </div>
              </div>

              <div className="customer-stats-grid">
                <div className="stat-card">
                  <i className="fas fa-calendar-check"></i>
                  <div>
                    <h4>{selectedCustomer.bookings}</h4>
                    <p>Total Bookings</p>
                  </div>
                </div>
                <div className="stat-card">
                  <i className="fas fa-dollar-sign"></i>
                  <div>
                    <h4>${selectedCustomer.totalSpent.toFixed(2)}</h4>
                    <p>Total Spent</p>
                  </div>
                </div>
                <div className="stat-card">
                  <i className="fas fa-chart-line"></i>
                  <div>
                    <h4>${(selectedCustomer.totalSpent / (selectedCustomer.bookings || 1)).toFixed(2)}</h4>
                    <p>Avg. Spend</p>
                  </div>
                </div>
                <div className="stat-card">
                  <i className="fas fa-clock"></i>
                  <div>
                    <h4>{formatDate(selectedCustomer.lastBooking)}</h4>
                    <p>Last Booking</p>
                  </div>
                </div>
              </div>

              <div className="appointments-section">
                <h3><i className="fas fa-history"></i> Booking History</h3>
                {customerAppointments.length === 0 ? (
                  <p className="no-appointments">No appointments found</p>
                ) : (
                  <div className="appointments-list">
                    {customerAppointments.map((apt, index) => (
                      <div key={index} className="appointment-item">
                        <div className="apt-date">
                          <i className="fas fa-calendar"></i>
                          {formatDate(apt.date)}
                        </div>
                        <div className="apt-time">
                          <i className="fas fa-clock"></i>
                          {apt.timeSlot}
                        </div>
                        <div className="apt-service">
                          <i className="fas fa-cut"></i>
                          {apt.services?.[0]?.name || 'Service'}
                        </div>
                        <div className="apt-price">
                          ${apt.services?.[0]?.price || 0}
                        </div>
                        <div className={`apt-status ${apt.status?.toLowerCase()}`}>
                          {apt.status || 'Pending'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;

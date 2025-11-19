import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import logo from '../../Assets/logo.png';
import './PromotionsPage.css';

const PromotionsPage = () => {
  const navigate = useNavigate();

  const [promotions, setPromotions] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch promotions from all salons (OPTIMIZED)
  useEffect(() => {
    const fetchPromotions = async () => {
      setLoading(true);
      try {
        // Fetch all salons
        const salonsRes = await axios.get('http://localhost:5000/api/salons');
        const salons = salonsRes.data;

        // Fetch promotions from all salons IN PARALLEL (much faster!)
        const promotionPromises = salons.map(salon =>
          axios.get(`http://localhost:5000/api/promotions/salon/${salon._id}`)
            .then(res => res.data.map(promo => ({
              ...promo,
              salonName: salon.name,
              salonId: salon._id
            })))
            .catch(() => [])
        );

        const allSalonPromotions = await Promise.all(promotionPromises);
        const allPromotions = allSalonPromotions.flat();

        setPromotions(allPromotions);
      } catch (err) {
        console.error('Error loading promotions', err);
        setPromotions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPromotions();
  }, []);

  // Filter promotions by tab
  const getFilteredPromotions = () => {
    const now = dayjs();
    let filtered = promotions;

    if (activeTab === 'active') {
      filtered = promotions.filter(p => {
        const start = dayjs(p.startDate);
        const end = dayjs(p.endDate);
        return now.isAfter(start) && now.isBefore(end) && p.status === 'active';
      });
    } else if (activeTab === 'expired') {
      filtered = promotions.filter(p => {
        const end = dayjs(p.endDate);
        return now.isAfter(end) || p.status === 'expired';
      });
    } else if (activeTab === 'scheduled') {
      filtered = promotions.filter(p => {
        const start = dayjs(p.startDate);
        return now.isBefore(start) || p.status === 'scheduled';
      });
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.salonName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.type?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredPromotions = getFilteredPromotions();

  // Calculate real stats from promotions data
  const activePromotions = promotions.filter(p => {
    const now = dayjs();
    const start = dayjs(p.startDate);
    const end = dayjs(p.endDate);
    return now.isAfter(start) && now.isBefore(end) && p.status === 'active';
  });

  const expiredPromotions = promotions.filter(p => {
    const now = dayjs();
    const end = dayjs(p.endDate);
    return now.isAfter(end) || p.status === 'expired';
  });

  const scheduledPromotions = promotions.filter(p => {
    const now = dayjs();
    const start = dayjs(p.startDate);
    return now.isBefore(start) || p.status === 'scheduled';
  });

  // Calculate conversion rate (active promotions / total promotions)
  const conversionRate = promotions.length > 0 
    ? Math.round((activePromotions.length / promotions.length) * 100) 
    : 0;

  // Calculate delivery success (active + scheduled / total)
  const deliverySuccess = promotions.length > 0
    ? Math.round(((activePromotions.length + scheduledPromotions.length) / promotions.length) * 100)
    : 0;

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
            <div className="sidebar-link" onClick={() => navigate('/customers')}>
              <i className="fas fa-users"></i>
              <span>Customers</span>
            </div>
            <div className="sidebar-link" onClick={() => navigate('/feedback')}>
              <i className="fas fa-comments"></i>
              <span>Feedback</span>
            </div>
            <div className="sidebar-link active" onClick={() => navigate('/promotions')}>
              <i className="fas fa-bullhorn"></i>
              <span>Promotions</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="admin-main-content">
          <div className="promotions-container">
            {/* Header */}
            <div className="promotions-header">
              <div>
                <h1 className="page-title">Promotions</h1>
                <p className="page-subtitle">Manage and analyze your salon's promotional campaigns.</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="promotions-tabs">
              <button
                className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                onClick={() => setActiveTab('active')}
              >
                Active
              </button>
              <button
                className={`tab-btn ${activeTab === 'expired' ? 'active' : ''}`}
                onClick={() => setActiveTab('expired')}
              >
                Expired
              </button>
              <button
                className={`tab-btn ${activeTab === 'scheduled' ? 'active' : ''}`}
                onClick={() => setActiveTab('scheduled')}
              >
                Scheduled
              </button>
            </div>

            {/* Overview Section */}
            <div className="overview-section">
              <h2 className="section-title">Overview</h2>
              <div className="overview-grid">
                {/* Conversion Rates Card */}
                <div className="overview-card">
                  <div className="card-header">
                    <h3>Active Promotions Rate</h3>
                    <div className="stat-value">{conversionRate}%</div>
                    <div className="stat-change positive">
                      {activePromotions.length} of {promotions.length} promotions
                    </div>
                  </div>
                  <div className="chart-container">
                    <div className="bar-chart">
                      <div className="bar" style={{ height: '60%' }}>
                        <div className="bar-fill"></div>
                      </div>
                      <div className="bar" style={{ height: '75%' }}>
                        <div className="bar-fill"></div>
                      </div>
                      <div className="bar" style={{ height: '50%' }}>
                        <div className="bar-fill"></div>
                      </div>
                      <div className="bar" style={{ height: '65%' }}>
                        <div className="bar-fill"></div>
                      </div>
                    </div>
                    <div className="chart-labels">
                      <span>Week 1</span>
                      <span>Week 2</span>
                      <span>Week 3</span>
                      <span>Week 4</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Success Card */}
                <div className="overview-card">
                  <div className="card-header">
                    <h3>Delivery Success</h3>
                    <div className="stat-value">92%</div>
                    <div className="stat-change negative">Last 30 Days -1%</div>
                  </div>
                  <div className="chart-container">
                    <svg className="line-chart" viewBox="0 0 300 100" preserveAspectRatio="none">
                      <polyline
                        points="0,50 75,30 150,45 225,20 300,35"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="2"
                      />
                    </svg>
                    <div className="chart-labels">
                      <span>Week 1</span>
                      <span>Week 2</span>
                      <span>Week 3</span>
                      <span>Week 4</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Promotions Section */}
            <div className="active-promotions-section">
              <h2 className="section-title">Active Promotions</h2>

              {/* Search Bar */}
              <div className="search-bar">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search promotions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filter Pills */}
              <div className="filter-pills">
                <span className="filter-pill">Salon</span>
                <span className="filter-pill">Promo Type</span>
                <span className="filter-pill">Status</span>
              </div>

              {/* Promotions Table */}
              <div className="promotions-table-container">
                <table className="promotions-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Salon</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPromotions.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="no-data">
                          No promotions found
                        </td>
                      </tr>
                    ) : (
                      filteredPromotions.map((promo) => (
                        <tr key={promo._id}>
                          <td className="promo-name">{promo.title}</td>
                          <td className="salon-name">{promo.salonName || 'N/A'}</td>
                          <td className="type-name">{promo.type || 'Targeted'}</td>
                          <td>
                            <span className="status-badge status-active">Active</span>
                          </td>
                          <td className="date-cell">{dayjs(promo.startDate).format('YYYY-MM-DD')}</td>
                          <td className="date-cell">{dayjs(promo.endDate).format('YYYY-MM-DD')}</td>
                          <td>
                            <button className="view-details-btn">View Details</button>
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

export default PromotionsPage;

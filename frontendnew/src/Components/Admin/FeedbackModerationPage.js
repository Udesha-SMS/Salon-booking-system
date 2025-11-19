import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../../Assets/logo.png';
import './FeedbackModeration.css';

const FeedbackModerationPage = () => {
  const navigate = useNavigate();

  const [feedbacks, setFeedbacks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch feedbacks/reviews from all salons
  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        // Fetch all salons
        const salonsRes = await axios.get('http://localhost:5000/api/salons');
        const salons = salonsRes.data;

        // Fetch reviews from all salons
        let allFeedbacks = [];
        for (const salon of salons) {
          try {
            const reviewsRes = await axios.get(`http://localhost:5000/api/reviews/salon/${salon._id}`);
            const salonReviews = reviewsRes.data.map(review => ({
              ...review,
              salonName: salon.name,
              salonId: salon._id,
              status: review.status || 'pending'
            }));
            allFeedbacks = [...allFeedbacks, ...salonReviews];
          } catch (err) {
            console.log(`No reviews for salon ${salon._id}`);
          }
        }

        setFeedbacks(allFeedbacks);
      } catch (err) {
        console.error('Error loading feedbacks', err);
      }
    };
    fetchFeedbacks();
  }, []);

  // Filter feedbacks by search
  const filteredFeedbacks = feedbacks.filter(feedback =>
    feedback.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    feedback.salonName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    feedback.comment?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate analytics
  const totalFeedbacks = feedbacks.length;
  const positiveFeedbacks = feedbacks.filter(f => f.rating >= 4).length;
  const negativeFeedbacks = feedbacks.filter(f => f.rating < 4).length;
  const positivePercentage = totalFeedbacks > 0 ? Math.round((positiveFeedbacks / totalFeedbacks) * 100) : 0;
  const negativePercentage = totalFeedbacks > 0 ? Math.round((negativeFeedbacks / totalFeedbacks) * 100) : 0;

  // Handle approve/reject actions
  const handleAction = async (feedbackId, action) => {
    try {
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      await axios.put(`http://localhost:5000/api/reviews/${feedbackId}`, { status: newStatus });
      
      // Update local state
      setFeedbacks(feedbacks.map(f => 
        f._id === feedbackId ? { ...f, status: newStatus } : f
      ));
    } catch (err) {
      console.error(`Failed to ${action} feedback`, err);
    }
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      case 'pending':
        return 'status-pending';
      default:
        return 'status-pending';
    }
  };

  // Get star rating display
  const getStarRating = (rating) => {
    return `${rating} stars`;
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
            <div className="sidebar-link" onClick={() => navigate('/customers')}>
              <i className="fas fa-users"></i>
              <span>Customers</span>
            </div>
            <div className="sidebar-link active" onClick={() => navigate('/feedback')}>
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
          <div className="feedback-container">
            {/* Header */}
            <div className="feedback-header">
              <div>
                <h1 className="page-title">Feedback Moderation</h1>
                <p className="page-subtitle">Review and manage feedback from clients.</p>
              </div>
            </div>

            {/* Feedback Analytics */}
            <div className="feedback-analytics">
              <h2 className="section-title">Feedback Analytics</h2>
              <div className="analytics-grid">
                <div className="analytics-card">
                  <h3>Positive Feedback</h3>
                  <div className="stat-value">{positivePercentage}%</div>
                </div>
                <div className="analytics-card">
                  <h3>Negative Feedback</h3>
                  <div className="stat-value">{negativePercentage}%</div>
                </div>
              </div>
            </div>

            {/* Feedback Table */}
            <div className="feedback-table-section">
              <h2 className="section-title">Feedback Table</h2>

              {/* Search Bar */}
              <div className="search-bar">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search by customer, salon, or review..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Table */}
              <div className="feedback-table-container">
                <table className="feedback-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Rating</th>
                      <th>Review</th>
                      <th>Customer</th>
                      <th>Salon</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFeedbacks.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="no-data">
                          No feedback found
                        </td>
                      </tr>
                    ) : (
                      filteredFeedbacks.map((feedback) => (
                        <tr key={feedback._id}>
                          <td>
                            <span className={`status-badge ${getStatusClass(feedback.status)}`}>
                              {feedback.status || 'Pending'}
                            </span>
                          </td>
                          <td className="rating-cell">{getStarRating(feedback.rating)}</td>
                          <td className="review-cell">
                            <div className="review-text">{feedback.comment || 'No comment provided'}</div>
                          </td>
                          <td>{feedback.user?.name || 'Unknown'}</td>
                          <td className="salon-cell">{feedback.salonName || 'N/A'}</td>
                          <td>
                            {feedback.status === 'pending' ? (
                              <div className="action-buttons">
                                <button 
                                  className="action-btn approve"
                                  onClick={() => handleAction(feedback._id, 'approve')}
                                >
                                  Approve/Reject
                                </button>
                              </div>
                            ) : (
                              <button className="action-btn view">View</button>
                            )}
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

export default FeedbackModerationPage;

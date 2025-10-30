import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../css/SelectServicesPage.css";

const SelectProfessionalPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { salon, selectedServices, showRatings, professionalId, highlightProfessional } = location.state || {};

  const [professionals, setProfessionals] = useState([]);
  const [popupService, setPopupService] = useState(null);
  const [serviceProfessionals, setServiceProfessionals] = useState({});
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Fetch professionals for this salon
  useEffect(() => {
    if (!salon?._id) return;
    
    const fetchProfessionals = async () => {
      try {
        setLoading(true);
        console.log("🔍 Fetching professionals for salon:", salon._id);
        
        const response = await fetch(`http://localhost:5000/api/professionals/${salon._id}`);
        if (!response.ok) throw new Error("Failed to fetch professionals");
        
        const data = await response.json();
        console.log("✅ Professionals fetched:", data);
        setProfessionals(data);
      } catch (err) {
        console.error("❌ Failed to fetch professionals", err);
        alert("Failed to load professionals");
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionals();
  }, [salon]);

  // Fetch reviews for all professionals in parallel
  useEffect(() => {
    if (professionals.length === 0) return;

    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        console.log("🔍 Fetching reviews for professionals...");
        
        const reviewPromises = professionals.map((pro) =>
          fetch(`http://localhost:5000/api/feedback/professionals/${pro._id}`)
            .then((res) => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return res.json();
            })
            .then((data) => {
              console.log(`✅ Reviews for ${pro.name}:`, data.feedbacks);
              return data.feedbacks || [];
            })
            .catch((err) => {
              console.error(`❌ Failed to fetch reviews for ${pro.name}:`, err);
              return [];
            })
        );

        const allReviews = await Promise.all(reviewPromises);
        const results = {};
        
        professionals.forEach((pro, index) => {
          results[pro._id] = allReviews[index];
        });
        
        setReviews(results);
        console.log("✅ All reviews loaded:", results);
      } catch (err) {
        console.error("❌ Failed to fetch professional reviews", err);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [professionals]);

  // Calculate average rating
  const getAverageRating = (proId) => {
    const feedbacks = reviews[proId] || [];
    if (feedbacks.length === 0) return 0;
    const total = feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0);
    return (total / feedbacks.length).toFixed(1);
  };

  // Calculate total price safely
  const totalPrice = selectedServices?.reduce((acc, s) => acc + (parseFloat(s.price) || 0), 0) || 0;

  // Popup handlers
  const openPopup = (service) => setPopupService(service);
  const closePopup = () => setPopupService(null);

  // Professional selection handler
  const handleSelectProForService = (serviceName, pro) => {
    setServiceProfessionals((prev) => ({
      ...prev,
      [serviceName]: pro,
    }));
    closePopup();
  };

  // Continue to next step
  const handleContinue = () => {
    // Validate professional selection for multiple services
    if (selectedServices.length > 1) {
      const selectedCount = Object.keys(serviceProfessionals).length;
      if (selectedCount !== selectedServices.length) {
        return alert("Please select a professional for each service");
      }
    }

    // Prepare selected professional data
    const selectedProfessional = selectedServices.length === 1
      ? serviceProfessionals[selectedServices[0].name] || { name: "Any Professional", _id: "any" }
      : serviceProfessionals;

    // Save to localStorage
    localStorage.setItem("selectedProfessional", JSON.stringify(selectedProfessional));
    localStorage.setItem("selectedServices", JSON.stringify(selectedServices));
    localStorage.setItem("selectedSalon", JSON.stringify(salon));

    console.log("➡️ Continuing to select-time with:", {
      selectedServices,
      selectedProfessional,
      salon
    });

    // Navigate to next page
    navigate("/select-time", {
      state: {
        selectedServices,
        selectedProfessional,
        salon,
      },
    });
  };

  // Render individual review
  const renderReview = (review, index) => (
    <div key={index} className="review-item">
      <div className="review-header">
        <span className="review-rating">⭐ {review.rating}/5</span>
        <span className="review-user">{review.userName || review.userEmail}</span>
        <span className="review-date">
          {review.reviewDate ? new Date(review.reviewDate).toLocaleDateString() : 'Recent'}
        </span>
      </div>
      {review.comment && (
        <p className="review-comment">"{review.comment}"</p>
      )}
    </div>
  );

  // Render professional card with reviews
  const renderProfessionalCard = (pro, serviceName = null, isInPopup = false) => {
    const proReviews = reviews[pro._id] || [];
    const avgRating = getAverageRating(pro._id);
    const isSelected = serviceName 
      ? serviceProfessionals[serviceName]?._id === pro._id
      : serviceProfessionals[selectedServices[0]?.name]?._id === pro._id;

    // Check if this professional should be highlighted
    const isHighlighted = highlightProfessional === pro._id;

    return (
      <div
        key={pro._id}
        className={`service-card ${isSelected ? "selected" : ""} ${isHighlighted ? "highlighted" : ""}`}
        onClick={() => serviceName 
          ? handleSelectProForService(serviceName, pro)
          : setServiceProfessionals({ [selectedServices[0].name]: pro })
        }
      >
        <div className="professional-info">
          <img
            src={
              pro.image
                ? pro.image.startsWith("http")
                  ? pro.image
                  : `http://localhost:5000/uploads/professionals/${pro.image}`
                : "https://via.placeholder.com/150"
            }
            alt={pro.name}
            className="service-image"
          />
          <div className="professional-details">
            <h4>
              {pro.name} 
              {isHighlighted && <span className="highlight-badge">Recently Reviewed</span>}
            </h4>
            <p className="professional-role">{pro.role}</p>
            
            {/* Ratings Summary */}
            {reviewsLoading ? (
              <p className="review-loading">Loading reviews...</p>
            ) : proReviews.length > 0 ? (
              <div className="ratings-section">
                <div className="rating-summary">
                  <span className="rating-stats">
                    ⭐ {avgRating} ({proReviews.length} review{proReviews.length !== 1 ? 's' : ''})
                  </span>
                </div>
                
                {/* Show reviews if not in popup and showRatings is true */}
                {!isInPopup && showRatings && (
                  <div className="reviews-list">
                    <h5>Recent Reviews:</h5>
                    {proReviews.slice(0, 3).map((review, idx) => renderReview(review, idx))}
                    {proReviews.length > 3 && (
                      <p className="more-reviews">+ {proReviews.length - 3} more reviews</p>
                    )}
                  </div>
                )}
                
                {/* In popup, show just the rating summary */}
                {isInPopup && proReviews.length > 0 && (
                  <div className="popup-reviews">
                    <p className="rating-stats">
                      ⭐ {avgRating} ({proReviews.length} review{proReviews.length !== 1 ? 's' : ''})
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="no-reviews">No reviews yet</p>
            )}
          </div>
        </div>
        <div className="checkbox-icon">
          {isSelected ? "✔" : "☐"}
        </div>
      </div>
    );
  };

  // Render any professional option
  const renderAnyProfessionalOption = () => (
    <div
      className={`service-card ${
        serviceProfessionals[selectedServices[0].name]?._id === "any" ? "selected" : ""
      }`}
      onClick={() =>
        setServiceProfessionals({
          [selectedServices[0].name]: {
            name: "Any Professional",
            _id: "any",
          },
        })
      }
    >
      <div>
        <h4>Any professional</h4>
        <p>We'll assign the best available professional</p>
      </div>
      <div className="checkbox-icon">
        {serviceProfessionals[selectedServices[0].name]?._id === "any" ? "✔" : "☐"}
      </div>
    </div>
  );

  // Render service card for multiple services
  const renderServiceCard = (service) => (
    <div key={service.id || service.name} className="service-card">
      <div className="service-card-content">
        <div>
          <h4>{service.name}</h4>
          <p>{service.duration}</p>
          <p>LKR {service.price}</p>
          <p className="selected-professional">
            Selected: {serviceProfessionals[service.name]?.name || "None"}
          </p>
        </div>
        <button
          className="assign-btn"
          onClick={() => openPopup(service)}
        >
          Assign
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="select-services-container">
        <div className="loading-message">Loading professionals...</div>
      </div>
    );
  }

  return (
    <div className="select-services-container">
      <div className="left-column">
        <p className="breadcrumb">
          Services &gt; <b>Professional</b> &gt; Time &gt; Confirm
        </p>
        <h2 className="heading-with-search">
          Select professionals
          {showRatings && <span className="ratings-badge">⭐ Reviews Displayed</span>}
        </h2>

        {selectedServices.length === 1 ? (
          <>
            <h4 className="service-for">For: {selectedServices[0].name}</h4>
            <div className="services-list">
              {renderAnyProfessionalOption()}
              {professionals.map((pro) => renderProfessionalCard(pro))}
            </div>
          </>
        ) : (
          <>
            <h4 className="service-for">For each service:</h4>
            <div className="services-list">
              {selectedServices.map(renderServiceCard)}
            </div>
          </>
        )}
      </div>

      <div className="right-column">
        <div className="summary-box">
          <img
            src={
              salon?.image
                ? salon.image.startsWith("http")
                  ? salon.image
                  : `http://localhost:5000/uploads/${salon.image}`
                : "https://via.placeholder.com/150"
            }
            alt="Salon"
            className="salon-image"
          />
          <div className="salon-info">
            <h4>{salon?.name}</h4>
            <p>{salon?.location}</p>
            {selectedServices?.map((service, index) => (
              <div key={index} className="service-summary">
                <p>
                  {service.name} — {service.duration}
                </p>
                <p>
                  <b>LKR {service.price}</b>
                </p>
              </div>
            ))}
          </div>
          <div className="total-section">
            <p>Total</p>
            <p>
              <strong>LKR {totalPrice}</strong>
            </p>
          </div>
          <button 
            className="continue-button" 
            onClick={handleContinue}
            disabled={selectedServices.length > 1 && Object.keys(serviceProfessionals).length !== selectedServices.length}
          >
            Continue
          </button>
        </div>
      </div>

      {/* Popup to assign professional per service */}
      {popupService && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Select professional for {popupService.name}</h3>
            <div className="services-list">
              {professionals.map((pro) => renderProfessionalCard(pro, popupService.name, true))}
            </div>
            <button className="cancel-button" onClick={closePopup}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectProfessionalPage;
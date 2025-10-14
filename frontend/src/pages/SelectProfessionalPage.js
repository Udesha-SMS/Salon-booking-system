import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../css/SelectServicesPage.css";

const SelectProfessionalPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { salon, selectedServices } = location.state || {};

  const [professionals, setProfessionals] = useState([]);
  const [popupService, setPopupService] = useState(null);
  const [serviceProfessionals, setServiceProfessionals] = useState({});
  const [reviews, setReviews] = useState({});

  // Fetch professionals for this salon
  useEffect(() => {
    if (!salon?._id) return;
    fetch(`http://localhost:5000/api/professionals/${salon._id}`)
      .then((res) => res.json())
      .then((data) => setProfessionals(data))
      .catch((err) => console.error("Failed to fetch professionals", err));
  }, [salon]);

  // Fetch reviews for all professionals in parallel
useEffect(() => {
  if (!professionals.length) return;

  Promise.all(
    professionals.map((pro) =>
      fetch(`http://localhost:5000/api/feedback/professionals/${pro._id}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("Reviews for", pro.name, ":", data.feedbacks);
          return data.feedbacks; // ✅ return only the feedback array
        })
    )
  ).then((results) => {
    const mapped = {};
    professionals.forEach((pro, index) => {
      mapped[pro._id] = results[index];
    });
    setReviews(mapped);
  });
}, [professionals]);




  // Calculate average rating
  const getAverageRating = (proId) => {
    const feedbacks = reviews[proId]?.feedbacks || [];
    if (feedbacks.length === 0) return 0;
    const total = feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0);
    return (total / feedbacks.length).toFixed(1);
  };

  const totalPrice =
    selectedServices?.reduce((acc, s) => acc + s.price, 0) || 0;

  const openPopup = (service) => setPopupService(service);
  const closePopup = () => setPopupService(null);

  const handleSelectProForService = (serviceName, pro) => {
    setServiceProfessionals((prev) => ({
      ...prev,
      [serviceName]: pro,
    }));
    closePopup();
  };

  const handleContinue = () => {
    if (
      selectedServices.length > 1 &&
      Object.keys(serviceProfessionals).length !== selectedServices.length
    ) {
      return alert("Please select a professional for each service");
    }

    const selectedProfessional =
      selectedServices.length === 1
        ? serviceProfessionals[selectedServices[0].name] || "any"
        : serviceProfessionals;

    localStorage.setItem(
      "selectedProfessional",
      JSON.stringify(selectedProfessional)
    );
    localStorage.setItem("selectedServices", JSON.stringify(selectedServices));
    localStorage.setItem("selectedSalon", JSON.stringify(salon));

    navigate("/select-time", {
      state: {
        selectedServices,
        selectedProfessional,
        salon,
      },
    });
  };

  return (
    <div className="select-services-container">
      <div className="left-column">
        <p className="breadcrumb">
          Services &gt; <b>Professional</b> &gt; Time &gt; Confirm
        </p>
        <h2 className="heading-with-search">Select professionals</h2>

        {selectedServices.length === 1 ? (
          <>
            <h4 style={{ marginTop: "10px" }}>
              For: {selectedServices[0].name}
            </h4>
            <div className="services-list">
              {/* Option for Any Professional */}
              <div
                className={`service-card ${
                  serviceProfessionals[selectedServices[0].name]?._id === "any"
                    ? "selected"
                    : ""
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
                </div>
                <div className="checkbox-icon">
                  {serviceProfessionals[selectedServices[0].name]?._id === "any"
                    ? "✔"
                    : "☐"}
                </div>
              </div>

              {/* List of Professionals */}
              {professionals.map((pro) => {
                const proReviews = reviews[pro._id]?.feedbacks || [];
                const avgRating = getAverageRating(pro._id);

                return (
                  <div
                    key={pro._id}
                    className={`service-card ${
                      serviceProfessionals[selectedServices[0].name]?._id ===
                      pro._id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setServiceProfessionals({
                        [selectedServices[0].name]: pro,
                      })
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
                      <div>
                        <h4>{pro.name}</h4>
                        <p>{pro.role}</p>

                        {reviews[pro._id] ? (
  reviews[pro._id].length > 0 ? (
    <>
      <p style={{ fontSize: "13px", color: "#555" }}>
        ⭐ {(
          reviews[pro._id].reduce((sum, r) => sum + r.rating, 0) /
          reviews[pro._id].length
        ).toFixed(1)} ({reviews[pro._id].length} reviews)
      </p>
      {reviews[pro._id].map((rev) => (
        <p key={rev._id} style={{ fontSize: "12px", color: "#777" }}>
          “{rev.comment}”
        </p>
      ))}
    </>
  ) : (
    <p style={{ fontSize: "13px", color: "#555" }}>No reviews yet</p>
  )
) : (
  <p style={{ fontSize: "13px", color: "#555" }}>Loading reviews...</p>
)}

                      </div>
                    </div>
                    <div className="checkbox-icon">
                      {serviceProfessionals[selectedServices[0].name]?._id ===
                      pro._id
                        ? "✔"
                        : "☐"}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <h4 style={{ marginTop: "10px" }}>For each service:</h4>
            <div className="services-list">
              {selectedServices.map((service) => (
                <div key={service.id} className="service-card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <h4>{service.name}</h4>
                      <p>{service.duration}</p>
                      <p>LKR {service.price}</p>
                      <p style={{ fontSize: "13px", color: "#777" }}>
                        Selected:{" "}
                        {serviceProfessionals[service.name]?.name || "None"}
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
              ))}
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
            {selectedServices?.map((s, index) => (
              <div key={index}>
                <p>
                  {s.name} — {s.duration}
                </p>
                <p>
                  <b>LKR {s.price}</b>
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
          <button className="continue-button" onClick={handleContinue}>
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
              {professionals.map((pro) => {
                const proReviews = reviews[pro._id]?.feedbacks || [];
                const avgRating = getAverageRating(pro._id);
                return (
                  <div
                    key={pro._id}
                    className={`service-card ${
                      serviceProfessionals[popupService.name]?._id === pro._id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      handleSelectProForService(popupService.name, pro)
                    }
                  >
                    <div className="professional-info">
                      <img
                        src={
                          pro.image
                            ? pro.image.startsWith("http")
                              ? pro.image
                              : `http://localhost:5000/uploads/professionals/${pro.image}`
                            : "https://via.placeholder.com/50"
                        }
                        alt={pro.name}
                      />
                      <div>
                        <h4>{pro.name}</h4>
                        <p>{pro.role}</p>
                        {proReviews.length > 0 ? (
                          <p style={{ fontSize: "13px", color: "#555" }}>
                            ⭐ {avgRating} ({proReviews.length} reviews)
                          </p>
                        ) : (
                          <p style={{ fontSize: "13px", color: "#555" }}>
                            No reviews yet
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="checkbox-icon">
                      {serviceProfessionals[popupService.name]?._id === pro._id
                        ? "✔"
                        : "☐"}
                    </div>
                  </div>
                );
              })}
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

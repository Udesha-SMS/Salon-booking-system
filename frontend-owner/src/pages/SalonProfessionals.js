import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "../css/SalonProfessionals.css";

// ...imports

const SalonProfessionalsV2 = () => {
  const navigate = useNavigate();
  const salon = JSON.parse(localStorage.getItem("salonUser"));

  const [professionals, setProfessionals] = useState([]);

  const [genderFilter, setGenderFilter] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState("All");

  const [formData, setFormData] = useState({
    name: "",
    gender: "", // must match backend enum: "Male" or "Female"
    service: "",
    serviceAvailability: "Both",
  });

  const [fileImage, setFileImage] = useState(null);
  const [fileCertificate, setFileCertificate] = useState(null);

  const [showPopup, setShowPopup] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState(null);

  // Fetch professionals
  const fetchProfessionals = async () => {
    if (!salon?.id) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/professionals/${salon.id}`
      );
      const data = await res.json();
      // Ensure gender exists, fallback to empty string if missing
      const professionalsWithGender = data.map((pro) => ({
        ...pro,
        gender: pro.gender || "", 
      }));
      setProfessionals(professionalsWithGender);
    } catch (err) {
      console.error("Fetch failed", err);
    }
  };

  useEffect(() => {
    fetchProfessionals();
  }, [salon?.id]);

  const handleInput = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAddOrUpdate = async () => {
    if (!formData.name || !formData.service || !formData.gender)
      return alert("Please fill all fields.");

    const form = new FormData();
    form.append("name", formData.name);
    form.append("gender", formData.gender); // important
    form.append("service", formData.service);
    form.append("serviceAvailability", formData.serviceAvailability);
    form.append("salonId", salon.id);

    if (fileImage) form.append("image", fileImage);
    if (fileCertificate) form.append("certificate", fileCertificate);

    const url = editingProfessional
      ? `http://localhost:5000/api/professionals/${editingProfessional._id}`
      : "http://localhost:5000/api/professionals";

    const method = editingProfessional ? "PUT" : "POST";

    const res = await fetch(url, { method, body: form });
    if (res.ok) {
      fetchProfessionals();
      setShowPopup(false);
      setEditingProfessional(null);
      setFormData({
        name: "",
        gender: "",
        service: "",
        serviceAvailability: "Both",
      });
      setFileImage(null);
      setFileCertificate(null);
    } else {
      alert("Save failed");
    }
  };

  const handleEdit = (pro) => {
    setFormData({
      name: pro.name,
      gender: pro.gender || "", // ensure gender shows in popup
      service: pro.service,
      serviceAvailability: pro.serviceAvailability || "Both",
    });
    setEditingProfessional(pro);
    setShowPopup(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete?")) return;
    await fetch(`http://localhost:5000/api/professionals/${id}`, {
      method: "DELETE",
    });
    fetchProfessionals();
  };

  const handleViewCertificate = (file) => {
    if (!file) return alert("No certificate uploaded.");
    const url = `http://localhost:5000/uploads/certificates/${file}`;
    window.open(url, "_blank");
  };

  // Filter logic
  const filteredProfessionals = professionals.filter((pro) => {
    const genderMatch = genderFilter === "All" || pro.gender === genderFilter;
    const availabilityMatch =
      availabilityFilter === "All" ||
      pro.serviceAvailability === availabilityFilter;
    return genderMatch && availabilityMatch;
  });

  return (
    <div className="pro-v2-container">
      {/* Sidebar */}
      <aside className="modern-sidebar">
        <img src={logo} alt="Logo" className="modern-logo" />
        <i className="fas fa-home" onClick={() => navigate("/dashboard")}></i>
        <i className="fas fa-users active"></i>
      </aside>

      <div className="pro-v2-main">
        {/* Filters */}
        <div className="filter-section">
          <h3>Filters</h3>
          <div className="filter-controls">
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
            >
              <option value="All">Filter by Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
            >
              <option value="All">Filter by Service Availability</option>
              <option value="Male">Male Only</option>
              <option value="Female">Female Only</option>
              <option value="Both">Both</option>
            </select>
          </div>
        </div>

        <header className="pro-v2-header">
          <h1>Salon Professionals</h1>
          <button
            className="pro-v2-add-btn"
            onClick={() => {
              setShowPopup(true);
              setEditingProfessional(null);
              setFormData({
                name: "",
                gender: "",
                service: "",
                serviceAvailability: "Both",
              });
            }}
          >
            Add Professional
          </button>
        </header>

        {/* Professional cards */}
        <div className="pro-v2-grid">
          {filteredProfessionals.map((pro) => (
            <div key={pro._id} className="pro-v2-card">
              <img
                src={
                  pro.image
                    ? `http://localhost:5000/uploads/professionals/${pro.image}`
                    : "https://via.placeholder.com/100"
                }
                alt={pro.name}
                className="pro-v2-image"
              />
              <div className="pro-v2-info">
                <strong>{pro.name}</strong>
                <p>Gender: {pro.gender}</p>
                <p>Service: {pro.service}</p>
                <p>Service Availability: {pro.serviceAvailability}</p>
                {pro.certificate ? (
                  <button
                    className="pro-v2-cert-btn"
                    onClick={() => handleViewCertificate(pro.certificate)}
                  >
                    View Certificate
                  </button>
                ) : (
                  <p className="no-cert">No Certificate</p>
                )}
                <div className="pro-v2-actions">
                  <button onClick={() => handleEdit(pro)}>Edit</button>
                  <button onClick={() => handleDelete(pro._id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popup form */}
      {showPopup && (
        <div className="pro-v2-popup-overlay">
          <div className="pro-v2-popup">
            <h2>{editingProfessional ? "Edit Professional" : "Add Professional"}</h2>

            <input
              name="name"
              value={formData.name}
              onChange={handleInput}
              placeholder="Name"
            />

            <select
              name="gender"
              value={formData.gender}
              onChange={handleInput}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <input
              name="service"
              value={formData.service}
              onChange={handleInput}
              placeholder="Service Provided"
            />

            <select
              name="serviceAvailability"
              value={formData.serviceAvailability}
              onChange={handleInput}
            >
              <option value="Male">Male Only</option>
              <option value="Female">Female Only</option>
              <option value="Both">Both</option>
            </select>

            <label>Upload Image</label>
            <input type="file" onChange={(e) => setFileImage(e.target.files[0])} />

            <label>Upload Certificate</label>
            <input type="file" onChange={(e) => setFileCertificate(e.target.files[0])} />

            <div className="pro-v2-popup-actions">
              <button className="pro-v2-save-btn" onClick={handleAddOrUpdate}>
                {editingProfessional ? "Update" : "Add"}
              </button>
              <button
                className="pro-v2-cancel-btn"
                onClick={() => setShowPopup(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalonProfessionalsV2;

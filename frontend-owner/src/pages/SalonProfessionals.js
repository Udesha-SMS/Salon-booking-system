import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "../css/SalonProfessionals.css"; // new CSS file

const SalonProfessionalsV2 = () => {
  const navigate = useNavigate();
  const salon = JSON.parse(localStorage.getItem("salonUser"));

  const [professionals, setProfessionals] = useState([]);
  const [formData, setFormData] = useState({ name: "", role: "", image: "" });
  const [showPopup, setShowPopup] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState(null);
  const [file, setFile] = useState(null);

  const fetchProfessionals = async () => {
    if (!salon?.id) return;
    try {
      const res = await fetch(`http://localhost:5000/api/professionals/${salon.id}`);
      const data = await res.json();
      setProfessionals(data);
    } catch (err) {
      console.error("Failed to fetch professionals", err);
    }
  };

  useEffect(() => {
    fetchProfessionals();
  }, [salon?.id]);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleAddOrUpdateProfessional = async () => {
    if (!formData.name || !formData.role) return alert("Please fill all fields");

    const form = new FormData();
    form.append("name", formData.name);
    form.append("role", formData.role);
    form.append("salonId", salon.id);

    if (file) form.append("image", file);
    else if (formData.image) form.append("image", formData.image);

    try {
      const url = editingProfessional
        ? `http://localhost:5000/api/professionals/${editingProfessional._id}`
        : "http://localhost:5000/api/professionals";
      const method = editingProfessional ? "PUT" : "POST";

      const res = await fetch(url, { method, body: form });
      if (res.ok) {
        fetchProfessionals();
        setShowPopup(false);
        setEditingProfessional(null);
        setFormData({ name: "", role: "", image: "" });
        setFile(null);
      } else {
        const error = await res.json();
        alert(error.message || "Failed to save professional");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (pro) => {
    setFormData({
      name: pro.name,
      role: pro.role,
      image: pro.image?.startsWith("http") ? pro.image : "",
    });
    setEditingProfessional(pro);
    setShowPopup(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure to delete?")) return;
    try {
      await fetch(`http://localhost:5000/api/professionals/${id}`, { method: "DELETE" });
      fetchProfessionals();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div className="pro-v2-container">
      {/* Updated Sidebar */}
      <aside className="modern-sidebar">
        <img src={logo} alt="Brand Logo" className="modern-logo" />
        <i className="fas fa-home" title="Home" onClick={() => navigate("/dashboard")}></i>
        <i className="fas fa-calendar-alt" title="Calendar" onClick={() => navigate("/calendar")}></i>
        <i className="fas fa-smile" title="Services" onClick={() => navigate("/services")}></i>
        <i className="fas fa-comment" title="Feedbacks" onClick={() => navigate("/feedbacks")}></i>
        <i className="fas fa-users active" title="Professionals"></i>
        <i className="fas fa-clock" title="Time Slots" onClick={() => navigate("/timeslots")}></i>
      </aside>

      {/* Main Content */}
      <div className="pro-v2-main">
        <header className="pro-v2-header">
          <h1>Salon Professionals</h1>
          <button
            className="pro-v2-add-btn"
            onClick={() => {
              setFormData({ name: "", role: "", image: "" });
              setFile(null);
              setEditingProfessional(null);
              setShowPopup(true);
            }}
          >
            {editingProfessional ? "Edit Professional" : "Add Professional"}
          </button>
        </header>

        <div className="pro-v2-grid">
          {professionals.map((pro) => (
            <div key={pro._id} className="pro-v2-card">
              <img
                src={
                  pro.image
                    ? pro.image.startsWith("http")
                      ? pro.image
                      : `http://localhost:5000/uploads/professionals/${pro.image}`
                    : "https://via.placeholder.com/100"
                }
                alt={pro.name}
                className="pro-v2-image"
              />
              <div className="pro-v2-info">
                <strong>{pro.name}</strong>
                <p>{pro.role}</p>
                <p>{pro.available ? "Available" : "Not Available"}</p>
                <div className="pro-v2-actions">
                  <button onClick={() => handleEdit(pro)}>Edit</button>
                  <button onClick={() => handleDelete(pro._id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showPopup && (
        <div className="pro-v2-popup-overlay">
          <div className="pro-v2-popup">
            <h2>{editingProfessional ? "Edit Professional" : "Add Professional"}</h2>
            <input name="name" value={formData.name} onChange={handleInputChange} placeholder="Name" />
            <input name="role" value={formData.role} onChange={handleInputChange} placeholder="Role" />
            <input name="image" value={formData.image} onChange={handleInputChange} placeholder="Image URL (optional)" />
            <input type="file" onChange={handleFileChange} />
            <div className="pro-v2-popup-actions">
              <button className="pro-v2-save-btn" onClick={handleAddOrUpdateProfessional}>
                {editingProfessional ? "Update" : "Add"}
              </button>
              <button className="pro-v2-cancel-btn" onClick={() => setShowPopup(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalonProfessionalsV2;

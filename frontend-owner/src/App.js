import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Page Components
import OwnerLogin from "./pages/OwnerLogin";
import RegisterPage1 from "./pages/RegisterPage1";
import BusinessSetupWizard from "./pages/BusinessSetupWizard";
import ModernDashboard from "./pages/ModernDashboard";
import SalonCalendar from "./pages/SalonCalendar";
import SalonServices from "./pages/SalonServices";
import SalonProfessionals from "./pages/SalonProfessionals";
import SalonTimeSlots from "./pages/SalonTimeSlots"; // ✅ NEW
import OwnerFeedbackPage from "./pages/OwnerFeedbackPage";
import SalonProfile from "./pages/SalonProfile";

function App() {
  return (
    <Router>
      <Routes>
        {/* Login Page */}
        <Route path="/" element={<OwnerLogin />} />

        {/* Registration Flow */}
        <Route path="/register" element={<RegisterPage1 />} />
        <Route path="/register-step-2" element={<BusinessSetupWizard />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<ModernDashboard />} />

        {/* Calendar Page */}
        <Route path="/calendar" element={<SalonCalendar />} />

        {/* Services */}
        <Route path="/services" element={<SalonServices />} />

        {/* Professionals */}
        <Route path="/professionals" element={<SalonProfessionals />} />

        {/* Time Slots - NEW */}
        <Route path="/timeslots" element={<SalonTimeSlots />} />

        {/* Feedbacks */}
        <Route path="/feedbacks" element={<OwnerFeedbackPage />} />

        {/* Salon Profile Page */}
        <Route path="/profile/:id" element={<SalonProfile />} />
      </Routes>
    </Router>
  );
}

export default App;
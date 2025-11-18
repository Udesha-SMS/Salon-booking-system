import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

// Common Components
import ErrorBoundary from './Components/Common/ErrorBoundary';

// Customer Components
import Home from './Components/Customer/HomePage';
import CustomerLogin from './Components/Customer/Login';
import Searchsalon from './Components/Customer/searchsalon';
import Profile from './Components/Customer/Profile';
import SelectServicesPage from './Components/Customer/SelectServicesPage';
import SelectProfessionalPage from './Components/Customer/SelectProfessionalPage';
import SelectTimePage from './Components/Customer/SelectTimePage';
import MyAppointmentsPage from "./Components/Customer/MyAppointmentsPage";
import FamilyBooking from './Components/Customer/FamilyBooking';
import FamilyBookingSelectService from './Components/Customer/FamilyBookingSelectService';
import FamilyBookingSelectProfessional from './Components/Customer/FamilyBookingSelectProfessional';
import FamilyBookingSelectTimePage from './Components/Customer/FamilyBookingSelectTimePage';
import BookSelectionPage from './Components/Customer/BookSelectionPage';
import CheckoutPage from './Components/Customer/CheckoutPage';
import ConfirmationPage from './Components/Customer/ConfirmationPage';

// Owner Components
import OwnerLogin from "./Components/Owner/OwnerLogin";
import RegisterPage1 from "./Components/Owner/RegisterPage1";
import BusinessSetupWizard from "./Components/Owner/BusinessSetupWizard";
import ModernDashboard from "./Components/Owner/ModernDashboard";
import SalonCalendar from "./Components/Owner/SalonCalendar";
import SalonServices from "./Components/Owner/SalonServices";
import SalonProfessionals from "./Components/Owner/SalonProfessionals";
import SalonTimeSlots from "./Components/Owner/SalonTimeSlots";
import OwnerFeedbackPage from "./Components/Owner/OwnerFeedbackPage";
import SalonProfile from "./Components/Owner/SalonProfile";

// Admin Components
import AdminDashboard from "./Components/Admin/AdminDashboard";
import SalonsManagement from "./Components/Admin/SalonsManagement";
import ReportsPage from "./Components/Admin/ReportsPage";
import CalendarPage from "./Components/Admin/CalendarPage";
import CustomersPage from "./Components/Admin/CustomersPage";
import FeedbackModerationPage from "./Components/Admin/FeedbackModerationPage";
import PromotionsPage from "./Components/Admin/PromotionsPage";
import LoyaltyPage from "./Components/Admin/LoyaltyPage";
import FinancialInsights from "./Components/Admin/FinancialInsights";
import SettingsPage from "./Components/Admin/SettingsPage";

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Customer Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login/customer" element={<CustomerLogin />} />
          <Route path="/searchsalon" element={<Searchsalon />} />
          <Route path="/profile" element={<Profile />} /> 
          <Route path="/select-services/:salonId" element={<SelectServicesPage />} />
          <Route path="/select-professional/:salonId" element={<SelectProfessionalPage />} />
          <Route path="/select-time" element={<SelectTimePage />} />
          <Route path="/appointments" element={<MyAppointmentsPage />} />
          <Route path="/familybooking" element={<FamilyBooking />} />
          <Route path="/familybookingselectservice/:salonId" element={<FamilyBookingSelectService />} />
          <Route path="/familybookingselectprofessional/:salonId" element={<FamilyBookingSelectProfessional />} />
          <Route path="/familybookingselecttimepage" element={<FamilyBookingSelectTimePage />} />
          <Route path="/bookselectionpage" element={<BookSelectionPage />} />
          <Route path="/checkoutpage" element={<CheckoutPage />} />
          <Route path="/confirmationpage" element={<ConfirmationPage />} />

          {/* Owner Routes */}
          <Route path="/OwnerLogin" element={<OwnerLogin />} />
          <Route path="/register" element={<RegisterPage1 />} />
          <Route path="/register-step-2" element={<BusinessSetupWizard />} />
          <Route path="/dashboard" element={<ModernDashboard />} />
          <Route path="/calendar" element={<SalonCalendar />} />
          <Route path="/services" element={<SalonServices />} />
          <Route path="/professionals" element={<SalonProfessionals />} />
          <Route path="/timeslots" element={<SalonTimeSlots />} />
          <Route path="/feedbacks" element={<OwnerFeedbackPage />} />
          <Route path="/profile/:id" element={<SalonProfile />} />

          {/* Admin Routes */}
          <Route path="/AdminDashboard" element={<AdminDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/salons" element={<SalonsManagement />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/admincalendar" element={<CalendarPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/feedback" element={<FeedbackModerationPage />} />
          <Route path="/promotions" element={<PromotionsPage />} />
          <Route path="/loyalty" element={<LoyaltyPage />} />
          <Route path="/financial" element={<FinancialInsights />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
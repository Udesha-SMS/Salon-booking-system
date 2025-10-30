import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';


import Home from './pages/HomePage';
// import LoginSelection from './pages/LoginSelection';
import CustomerLogin from './pages/Login';
import Searchsalon from './pages/searchsalon';
import Profile from './pages/Profile';
import SelectServicesPage from './pages/SelectServicesPage';
import SelectProfessionalPage from './pages/SelectProfessionalPage';
import SelectTimePage from './pages/SelectTimePage';
import MyAppointmentsPage from "./pages/MyAppointmentsPage";
import FamilyBooking from './pages/FamilyBooking';
import FamilyBookingSelectService from './pages/FamilyBookingSelectService';
import FamilyBookingSelectProfessional from './pages/FamilyBookingSelectProfessional';
import FamilyBookingSelectTimePage from './pages/FamilyBookingSelectTimePage';
import BookSelectionPage from './pages/BookSelectionPage';
//import Payment from './pages/Payment';
import CheckoutPage from './pages/CheckoutPage';
import ConfirmationPage from './pages/ConfirmationPage';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* <Route path="/login" element={<LoginSelection />} /> */}
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
       {/* <Route path="/payment" element={<Payment />} /> */}
       <Route path="/checkoutpage" element={<CheckoutPage />} />
       <Route path="/confirmationpage" element={<ConfirmationPage />} />

      </Routes>
    </Router>
  );
}

export default App;

import { Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import HowItWorks from "./pages/HowItWorks.jsx";
import FindDoctors from "./pages/FindDoctors.jsx";
import DoctorDetails from "./pages/DoctorDetails.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Contact from "./pages/Contact.jsx";
import NotFound from "./pages/NotFound.jsx";
import ConsultationRoom from "./pages/ConsultationRoom.jsx";

import PatientDashboard from "./pages/patient/PatientDashboard.jsx";
import BookAppointment from "./pages/patient/BookAppointment.jsx";
import MyAppointments from "./pages/patient/MyAppointments.jsx";
import PatientProfile from "./pages/patient/Profile.jsx";

import DoctorDashboard from "./pages/doctor/DoctorDashboard.jsx";
import DoctorAppointments from "./pages/doctor/DoctorAppointments.jsx";
import Availability from "./pages/doctor/Availability.jsx";
import DoctorProfile from "./pages/doctor/Profile.jsx";

import InterpreterDashboard from "./pages/interpreter/InterpreterDashboard.jsx";
import InterpreterRequests from "./pages/interpreter/InterpreterRequests.jsx";
import InterpreterProfile from "./pages/interpreter/Profile.jsx";

export default function App() {
  return (
    <Routes>
      {/* Public site */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/doctors" element={<FindDoctors />} />
        <Route path="/doctors/:id" element={<DoctorDetails />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Video consultation room — full-bleed, no navbar/footer chrome */}
      <Route
        path="/consultation/:appointmentId"
        element={
          <ProtectedRoute roles={["patient", "doctor", "interpreter"]}>
            <ConsultationRoom />
          </ProtectedRoute>
        }
      />

      {/* Patient dashboard */}
      <Route
        element={
          <ProtectedRoute roles={["patient"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
        <Route path="/patient/book/:doctorId" element={<BookAppointment />} />
        <Route path="/patient/appointments" element={<MyAppointments />} />
        <Route path="/patient/profile" element={<PatientProfile />} />
      </Route>

      {/* Doctor dashboard */}
      <Route
        element={
          <ProtectedRoute roles={["doctor"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/doctor/appointments" element={<DoctorAppointments />} />
        <Route path="/doctor/availability" element={<Availability />} />
        <Route path="/doctor/profile" element={<DoctorProfile />} />
      </Route>

      {/* Interpreter dashboard */}
      <Route
        element={
          <ProtectedRoute roles={["interpreter"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/interpreter/dashboard" element={<InterpreterDashboard />} />
        <Route path="/interpreter/requests" element={<InterpreterRequests />} />
        <Route path="/interpreter/profile" element={<InterpreterProfile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

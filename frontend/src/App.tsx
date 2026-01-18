import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CompleteProfile from "./pages/CompleteProfile";
import NotFound from "./pages/NotFound";

// Student Pages
import StudentDashboard from "./pages/student/Dashboard";
import FindFaculty from "./pages/student/FindFaculty";
import StudentAppointments from "./pages/student/Appointments";
import FollowedFaculty from "./pages/student/FollowedFaculty";
import StudentSettings from "./pages/student/Settings";
import StudentNotifications from "./pages/student/Notifications";

// Faculty Pages
import FacultyDashboard from "./pages/faculty/Dashboard";
import FacultyAvailability from "./pages/faculty/Availability";
import FacultyAppointments from "./pages/faculty/Appointments";
import FacultyFollowers from "./pages/faculty/Followers";
import FacultySettings from "./pages/faculty/Settings";
import FacultyNotifications from "./pages/faculty/Notifications";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Protected Routes (Auth Required) */}
            <Route
              path="/complete-profile"
              element={
                <ProtectedRoute>
                  <CompleteProfile />
                </ProtectedRoute>
              }
            />

            {/* Student Routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedUserType="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/faculty"
              element={
                <ProtectedRoute allowedUserType="student">
                  <FindFaculty />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/appointments"
              element={
                <ProtectedRoute allowedUserType="student">
                  <StudentAppointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/followed"
              element={
                <ProtectedRoute allowedUserType="student">
                  <FollowedFaculty />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/settings"
              element={
                <ProtectedRoute allowedUserType="student">
                  <StudentSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/notifications"
              element={
                <ProtectedRoute allowedUserType="student">
                  <StudentNotifications />
                </ProtectedRoute>
              }
            />

            {/* Faculty Routes */}
            <Route
              path="/faculty/dashboard"
              element={
                <ProtectedRoute allowedUserType="faculty">
                  <FacultyDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/availability"
              element={
                <ProtectedRoute allowedUserType="faculty">
                  <FacultyAvailability />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/appointments"
              element={
                <ProtectedRoute allowedUserType="faculty">
                  <FacultyAppointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/followers"
              element={
                <ProtectedRoute allowedUserType="faculty">
                  <FacultyFollowers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/settings"
              element={
                <ProtectedRoute allowedUserType="faculty">
                  <FacultySettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/notifications"
              element={
                <ProtectedRoute allowedUserType="faculty">
                  <FacultyNotifications />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

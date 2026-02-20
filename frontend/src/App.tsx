import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
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
      <NotificationsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Student Routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedUserType="STUDENT">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/find-faculty"
              element={
                <ProtectedRoute allowedUserType="STUDENT">
                  <FindFaculty />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/faculty"
              element={<Navigate to="/student/find-faculty" replace />}
            />
            <Route
              path="/student/appointments"
              element={
                <ProtectedRoute allowedUserType="STUDENT">
                  <StudentAppointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/followed"
              element={
                <ProtectedRoute allowedUserType="STUDENT">
                  <FollowedFaculty />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/settings"
              element={
                <ProtectedRoute allowedUserType="STUDENT">
                  <StudentSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/notifications"
              element={
                <ProtectedRoute allowedUserType="STUDENT">
                  <StudentNotifications />
                </ProtectedRoute>
              }
            />

            {/* Faculty Routes */}
            <Route
              path="/faculty/dashboard"
              element={
                <ProtectedRoute allowedUserType="FACULTY">
                  <FacultyDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/availability"
              element={
                <ProtectedRoute allowedUserType="FACULTY">
                  <FacultyAvailability />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/appointments"
              element={
                <ProtectedRoute allowedUserType="FACULTY">
                  <FacultyAppointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/followers"
              element={
                <ProtectedRoute allowedUserType="FACULTY">
                  <FacultyFollowers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/settings"
              element={
                <ProtectedRoute allowedUserType="FACULTY">
                  <FacultySettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/notifications"
              element={
                <ProtectedRoute allowedUserType="FACULTY">
                  <FacultyNotifications />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </NotificationsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

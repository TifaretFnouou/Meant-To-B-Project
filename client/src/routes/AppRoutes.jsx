import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ProfilePage from "../pages/ProfilePage";
import MentorsCatalogPage from "../pages/MentorsCatalogPage";
import BecomeMentorPage from "../pages/BecomeMentorPage";
import MySessionsPage from "../pages/MySessionsPage";
import AdminPage from "../pages/admin/AdminPage";
import ProtectedRoute from "./ProtectedRoute";
import { ROLES } from "../constants";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mentors"
        element={
          <ProtectedRoute>
            <MentorsCatalogPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/become-mentor"
        element={
          <ProtectedRoute>
            <BecomeMentorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sessions"
        element={
          <ProtectedRoute>
            <MySessionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <AdminPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

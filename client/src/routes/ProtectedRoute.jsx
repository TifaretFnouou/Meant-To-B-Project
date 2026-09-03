import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, roles = [] }) {
  const { isAuthenticated, currentUser, authReady } = useAuth();
  const location = useLocation();

  if (!authReady) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0) {
    const hasRole = roles.some((role) => currentUser.roles?.includes(role));
    if (!hasRole) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

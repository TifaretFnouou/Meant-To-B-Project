import React, { useState, useEffect } from "react";
import { Box, Typography, Tabs, Tab, Paper, Grid, Alert, AlertTitle, Stack } from "@mui/material";
import MainLayout from "../../components/layout/MainLayout";
import { useAuth } from "../../context/AuthContext";
import AnalyticsTab from "./AnalyticsTab";
import AdminAlertsCarousel from "./AdminAlertsCarousel";
import UsersTab from "./UsersTab";
import MeetingsTab from "./MeetingsTab";
import CalendarTab from "./CalendarTab";
import ConfigTab from "./ConfigTab";

export default function AdminPage() {
  const { users, token } = useAuth();
  const [tab, setTab] = useState(0);
  const [meetingsInitialStatusFilter, setMeetingsInitialStatusFilter] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [meetings, setMeetings] = useState([]);

  console.log("[AdminPage] render. token:", token, "| users:", users);

  const fetchAlerts = React.useCallback(async () => {
    console.log("[fetchAlerts] START, token:", token);
    try {
      const res = await fetch("/api/v1/admin/alerts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("[fetchAlerts] HTTP status:", res.status, res.statusText);

      if (!res.ok) {
        const text = await res.text();
        console.error("[fetchAlerts] response NOT ok. body:", text);
        return;
      }

      const data = await res.json();
      console.log("[fetchAlerts] parsed JSON:", data);

      if (data.success) {
        setAlerts(data.data);
        console.log("[fetchAlerts] setAlerts called with:", data.data);
      } else {
        console.warn("[fetchAlerts] data.success is falsy. Full data:", data);
      }
    } catch (error) {
      console.error("[fetchAlerts] EXCEPTION (network/CORS/parse error):", error);
    }
  }, [token]);

  const fetchMeetings = React.useCallback(async () => {
    console.log("[fetchMeetings] START, token:", token);
    try {
      const res = await fetch("/api/v1/admin/meetings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("[fetchMeetings] HTTP status:", res.status, res.statusText);

      if (!res.ok) {
        const text = await res.text();
        console.error("[fetchMeetings] response NOT ok. body:", text);
        return;
      }

      const data = await res.json();
      console.log("[fetchMeetings] parsed JSON:", data);
      console.log("[fetchMeetings] data.data is array?", Array.isArray(data.data), "length:", data.data?.length);

      if (data.success) {
        setMeetings(data.data || []);
        console.log("[fetchMeetings] setMeetings called with:", data.data);
      } else {
        console.warn("[fetchMeetings] data.success is falsy. Full data:", data);
      }
    } catch (error) {
      console.error("[fetchMeetings] EXCEPTION (network/CORS/parse error):", error);
    }
  }, [token]);

  useEffect(() => {
    console.log("[useEffect] fired. token exists?", Boolean(token), "token value:", token);
    if (token) {
      fetchAlerts();
      fetchMeetings();
    } else {
      console.warn("[useEffect] NO TOKEN - fetch calls skipped entirely. This is likely the bug.");
    }
  }, [token, fetchAlerts, fetchMeetings]);

  useEffect(() => {
    console.log("[meetings state changed] current meetings:", meetings, "length:", meetings.length);
  }, [meetings]);

  const activeMeetings = meetings.filter(s => !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(s.status));

  return (
    <MainLayout>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Control Panel - Community Manager
      </Typography>

      <AdminAlertsCarousel alerts={alerts} />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={6}><Paper sx={{ p: 2, textAlign: "center" }}><Typography variant="h4">{users.length}</Typography><Typography variant="body2" color="text.secondary">Users</Typography></Paper></Grid>
        <Grid item xs={6} md={6}><Paper sx={{ p: 2, textAlign: "center" }}><Typography variant="h4">{activeMeetings.length}</Typography><Typography variant="body2" color="text.secondary">Active Meetings</Typography></Paper></Grid>
      </Grid>

      <Tabs value={tab} onChange={(_, v) => { console.log("[Tabs] switched to tab index:", v); setTab(v); }}>
        <Tab label="Users List" />
        <Tab label="Meetings Report" />
        <Tab label="Calendar" />
        <Tab label="Categories & Tags" />
        <Tab label="Analytics" />
      </Tabs>

      <Box sx={{ pt: 3 }}>
        {tab === 0 && <UsersTab users={users} />}
        {tab === 1 && <MeetingsTab meetings={meetings} users={users} initialStatusFilter={meetingsInitialStatusFilter} />}
        {tab === 2 && <CalendarTab meetings={meetings} />}
        {tab === 3 && <ConfigTab />}
        {tab === 4 && <AnalyticsTab meetings={meetings} />}
      </Box>
    </MainLayout>
  );
}
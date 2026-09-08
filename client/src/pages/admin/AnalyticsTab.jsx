import React, { useMemo } from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from "recharts";
import brand from "../../theme/brand"; 

const COMPLETED_STATUSES = ["COMPLETED", "FEEDBACK_FILLED"];

const STATUS_COLORS = {
  Completed: brand.dustyRose,   // The main color of the brand - positive status
  Cancelled: brand.charcoal,    // Dark color - marks a negative/significant status
  "No Show": brand.pastelYellow, // Light yellow - "warning" fine detail
};

function getMeetingDate(m) {
  return m.scheduledTime?.startTime || m.createdAt;
}

function monthLabel(date) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

// Build 6 "buckets" of monthly data (from the current month backwards), so the chart shows trends even if
// there are no meetings in every month - and not just the months that actually have meetings.
function buildVolumeTrend(meetings) {
  const now = new Date();
  const buckets = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: monthLabel(d), count: 0 });
  }
  const bucketMap = Object.fromEntries(buckets.map((b) => [b.key, b]));

  meetings.forEach((m) => {
    const date = getMeetingDate(m);
    if (!date) return;
    const d = new Date(date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (bucketMap[key]) bucketMap[key].count += 1;
  });

  return buckets;
}

function getPersonName(person) {
  if (!person) return "Unknown";
  if (typeof person === "string") return person;
  return `${person.firstName || ""} ${person.lastName || ""}`.trim() || "Unknown";
}

function getPersonId(person) {
  if (!person) return "";
  if (typeof person === "string") return person;
  return String(person._id || person.id || "");
}

export default function AnalyticsTab({ meetings = [] }) {
  const volumeTrend = useMemo(() => buildVolumeTrend(meetings), [meetings]);

  const statusBreakdown = useMemo(() => {
    let completed = 0;
    let cancelled = 0;
    let noShow = 0;

    meetings.forEach((m) => {
      if (COMPLETED_STATUSES.includes(m.status)) completed += 1;
      else if (m.status === "CANCELLED") cancelled += 1;
      else if (m.status === "NO_SHOW") noShow += 1;
    });

    const concluded = completed + cancelled + noShow;

    return {
      completed,
      cancelled,
      noShow,
      concluded,
      completionRate: concluded > 0 ? Math.round((completed / concluded) * 100) : 0,
      data: [
        { name: "Completed", value: completed },
        { name: "Cancelled", value: cancelled },
        { name: "No Show", value: noShow },
      ].filter((d) => d.value > 0),
    };
  }, [meetings]);

  const topMentors = useMemo(() => {
    const counts = {};
    meetings.forEach((m) => {
      if (!COMPLETED_STATUSES.includes(m.status)) return;
      const id = getPersonId(m.mentorId);
      if (!id) return;
      if (!counts[id]) counts[id] = { name: getPersonName(m.mentorId), count: 0 };
      counts[id].count += 1;
    });
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [meetings]);

  const ratingStats = useMemo(() => {
    const ratings = [];
    meetings.forEach((m) => {
      if (m.menteeFeedback?.isFilled && m.menteeFeedback.rating) ratings.push(m.menteeFeedback.rating);
      if (m.mentorFeedback?.isFilled && m.mentorFeedback.rating) ratings.push(m.mentorFeedback.rating);
    });

    const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    const distribution = [1, 2, 3, 4, 5].map((star) => ({
      star: `${star}★`,
      count: ratings.filter((r) => r === star).length,
    }));

    const meetingsWithFeedback = meetings.filter(
      (m) => m.status === "FEEDBACK_FILLED" || m.menteeFeedback?.isFilled || m.mentorFeedback?.isFilled
    ).length;

    return { avg, count: ratings.length, distribution, meetingsWithFeedback };
  }, [meetings]);

  const kpis = [
    { label: "Total Meetings", value: meetings.length },
    { label: "Completion Rate", value: `${statusBreakdown.completionRate}%` },
    { label: "Avg. Feedback Rating", value: ratingStats.count > 0 ? `${ratingStats.avg.toFixed(1)} / 5` : "—" },
    { label: "Feedback Submitted", value: ratingStats.meetingsWithFeedback },
    { label: "Top Mentor", value: topMentors[0]?.name || "—" },
  ];

  return (
    <Box>
      {/* KPI cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid item xs={6} md={4} key={kpi.label}>
            <Paper sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h5" fontWeight={700}>{kpi.value}</Typography>
              <Typography variant="body2" color="text.secondary">{kpi.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* נפח פגישות לאורך זמן */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, height: 320 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Meeting Volume (last 6 months)
            </Typography>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={volumeTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke={brand.dustyRose} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Completion vs Cancellation/No-Show */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, height: 320 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Completion vs Cancelled / No-Show
            </Typography>
            {statusBreakdown.concluded === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: "center" }}>
                No concluded meetings yet.
              </Typography>
            ) : (
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Pie
                    data={statusBreakdown.data}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                    label={false}
                    labelLine={false}
                  >
                    {statusBreakdown.data.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#999"} />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value, entry) => `${value}: ${entry.payload.value}`}
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Top Mentors */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, height: 320 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Top Mentors (by completed meetings)
            </Typography>
            {topMentors.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: "center" }}>
                No completed meetings yet.
              </Typography>
            ) : (
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={topMentors} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill={brand.lavender} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Feedback Rating Distribution */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, height: 320 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Feedback Rating Distribution
            </Typography>
            {ratingStats.count === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: "center" }}>
                No feedback submitted yet.
              </Typography>
            ) : (
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={ratingStats.distribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="star" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill={brand.peach} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
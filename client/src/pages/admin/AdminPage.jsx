import React, { useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Chip,
  TextField,
  Button,
  Grid,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import MainLayout from "../../components/layout/MainLayout";
import StatusBadge from "../../components/common/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { useScheduling } from "../../context/SchedulingContext";
import { useAdminConfig } from "../../context/AdminConfigContext";
import { UserIdentity } from "../../components/common/UserAvatar";

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

export default function AdminPage() {
  const { users } = useAuth();
  const { sessions } = useScheduling();
  const { techStack, adviceTopics, addTech, removeTech, addTopic, removeTopic } =
    useAdminConfig();
  const [tab, setTab] = useState(0);
  const [newTech, setNewTech] = useState("");
  const [newTopic, setNewTopic] = useState("");

  const activeSessions = sessions.filter(
    (s) => !["cancelled", "completed"].includes(s.status)
  );
  const cancelled = sessions.filter((s) => s.status === "cancelled");
  const withFeedback = sessions.filter(
    (s) => s.feedback?.mentor || s.feedback?.mentee
  );

  return (
    <MainLayout>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        לוח בקרה — מנהלת קהילה
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4">{users.length}</Typography>
            <Typography variant="body2">משתמשות</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4">{activeSessions.length}</Typography>
            <Typography variant="body2">פגישות פעילות</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4">{cancelled.length}</Typography>
            <Typography variant="body2">פגישות שבוטלו</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4">{withFeedback.length}</Typography>
            <Typography variant="body2">משובים</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="משתמשות" />
        <Tab label="פגישות" />
        <Tab label="קטגוריות ותגיות" />
      </Tabs>

      <TabPanel value={tab} index={0}>
        <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
        <Table sx={{ minWidth: 680 }}>
          <TableHead>
            <TableRow>
              <TableCell>שם</TableCell>
              <TableCell>אימייל</TableCell>
              <TableCell>תפקידים</TableCell>
              <TableCell>חברה</TableCell>
              <TableCell>ניסיון</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <UserIdentity user={u} avatarSize={34} />
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  {u.roles?.map((r) => (
                    <Chip key={r} label={r} size="small" sx={{ mr: 0.5 }} />
                  ))}
                </TableCell>
                <TableCell>{u.company || "—"}</TableCell>
                <TableCell>{u.yearsOfExperience ?? 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
        <Table sx={{ minWidth: 720 }}>
          <TableHead>
            <TableRow>
              <TableCell>מנטורית</TableCell>
              <TableCell>מנטית</TableCell>
              <TableCell>סטטוס</TableCell>
              <TableCell>מועד</TableCell>
              <TableCell>משוב</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map((s) => {
              const mentor = users.find((u) => u.id === s.mentorId);
              const mentee = users.find((u) => u.id === s.menteeId);
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    <UserIdentity user={mentor} avatarSize={32} />
                  </TableCell>
                  <TableCell>
                    <UserIdentity user={mentee} avatarSize={32} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} schedulingState={s.schedulingState} />
                  </TableCell>
                  <TableCell>
                    {s.matchedSlot
                      ? new Date(s.matchedSlot).toLocaleString("he-IL")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {s.feedback?.mentor || s.feedback?.mentee ? "✓" : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                שפות פיתוח / טכנולוגיות
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <TextField
                  size="small"
                  value={newTech}
                  onChange={(e) => setNewTech(e.target.value)}
                  placeholder="הוספת טכנולוגיה"
                />
                <Button
                  variant="contained"
                  onClick={() => {
                    if (newTech.trim()) {
                      addTech(newTech.trim());
                      setNewTech("");
                    }
                  }}
                >
                  הוספה
                </Button>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {techStack.map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    onDelete={() => removeTech(t)}
                    deleteIcon={<DeleteIcon />}
                  />
                ))}
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                תחומי ייעוץ
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <TextField
                  size="small"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="הוספת תחום"
                />
                <Button
                  variant="contained"
                  onClick={() => {
                    if (newTopic.trim()) {
                      addTopic(newTopic.trim());
                      setNewTopic("");
                    }
                  }}
                >
                  הוספה
                </Button>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {adviceTopics.map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    onDelete={() => removeTopic(t)}
                    deleteIcon={<DeleteIcon />}
                  />
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
    </MainLayout>
  );
}

import React, { useState } from "react";
import { 
  Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, 
  FormControl, InputLabel, Select, MenuItem, Box, Typography 
} from "@mui/material";
import StatusBadge from "../../components/common/StatusBadge";
import { UserIdentity } from "../../components/common/UserAvatar";
import AdminMeetingDialog from "./AdminMeetingDialog";
import { STATUS_LABELS } from "../../utils/statusLabels";

export default function MeetingsTab({ meetings = [], users = [] }) {
  const [statusFilter, setStatusFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  const extractId = (userField) => {
    if (!userField) return "";
    if (typeof userField === "string") return userField;
    return userField._id ? userField._id.toString() : (userField.id ? userField.id.toString() : "");
  };

  const filteredMeetings = meetings.filter(m => {
    const matchStatus = statusFilter ? m.status === statusFilter : true;
    
    const mentorIdStr = extractId(m.mentorId);
    const menteeIdStr = extractId(m.menteeId);
    
    const matchUser = userFilter 
      ? (mentorIdStr === userFilter || menteeIdStr === userFilter) 
      : true;

    return matchStatus && matchUser;
  });

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
        {/* filter by status*/}
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select value={statusFilter} label="Filter by Status" onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value=""><em>All Statuses</em></MenuItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>{label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* filter by participant*/}
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Participant</InputLabel>
          <Select value={userFilter} label="Filter by Participant" onChange={(e) => setUserFilter(e.target.value)}>
            <MenuItem value=""><em>All Users</em></MenuItem>
            {users.map(u => {
              const uId = u.id || u._id;
              return (
                <MenuItem key={uId} value={uId.toString()}>
                  {u.firstName} {u.lastName}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Mentor</TableCell>  
              <TableCell>Mentee</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMeetings.length > 0 ? (
              filteredMeetings.map((s) => (
                <TableRow 
                  key={s._id || s.id} 
                  hover 
                  onClick={() => setSelectedMeeting(s)} 
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell><UserIdentity user={s.mentorId} avatarSize={32} /></TableCell>
                  <TableCell><UserIdentity user={s.menteeId} avatarSize={32} /></TableCell>
                  <TableCell><StatusBadge status={s.status} /></TableCell>
                  <TableCell>
                    {s.scheduledTime?.startTime 
                      ? new Date(s.scheduledTime.startTime).toLocaleString("he-IL") 
                      : "Pending"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No meetings found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <AdminMeetingDialog
        open={Boolean(selectedMeeting)}
        meeting={selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
      />
    </Box>
  );
}
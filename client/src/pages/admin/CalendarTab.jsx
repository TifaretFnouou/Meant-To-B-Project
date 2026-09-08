
import React, { useState } from "react";
import { Box } from "@mui/material";
import WeekCalendar from "../../components/calendar/WeekCalendar"; 
import AdminMeetingDialog from "./AdminMeetingDialog";
import { startOfWeek } from "../../utils/calendar"; 

export default function CalendarTab({ meetings }) {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  // Map backend meetings to calendar events
  const events = meetings
    .filter((m) => m.scheduledTime?.startTime) 
    .map((m) => {
      let typeKey = "pending"; 
      
      if (["COMPLETED", "FEEDBACK_FILLED"].includes(m.status)) {
        typeKey = "completed";
      } else if (["MATCHED", "ATTENDANCE_CONFIRMED"].includes(m.status)) {
        typeKey = "matched";
      } else if (["CANCELLED", "NO_SHOW"].includes(m.status)) {
        typeKey = "cancelled"; 
      }

      return {
        id: m._id,
        meetingId: m._id, // Required by WeekCalendar to make the event clickable
        start: new Date(m.scheduledTime.startTime),
        type: typeKey, 
        originalMeeting: m,
      };
    });

  const handleEventClick = (event) => {
    setSelectedMeeting(event.originalMeeting);
  };

  return (
    <Box>
      <WeekCalendar
        weekStart={weekStart}
        onWeekChange={setWeekStart}
        mode="view" // View mode only for admin
        events={events}
        onEventClick={handleEventClick}
      />

      <AdminMeetingDialog
        open={Boolean(selectedMeeting)}
        meeting={selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
      />
    </Box>
  );
}
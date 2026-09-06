// import React, { useEffect, useMemo, useState } from "react";
// import {
//   Alert,
//   Box,
//   Chip,
//   Stack,
//   ToggleButton,
//   ToggleButtonGroup,
//   Typography,
// } from "@mui/material";
// import { Navigate, useNavigate } from "react-router-dom";
// import MainLayout from "../components/layout/MainLayout";
// import PageHeader from "../components/common/PageHeader";
// import WeekCalendar from "../components/calendar/WeekCalendar";
// import MeetingEventDialog from "../components/calendar/MeetingEventDialog";
// import { useAuth } from "../context/AuthContext";
// import { useRoleMode } from "../context/RoleModeContext";
// import { useScheduling } from "../context/SchedulingContext";
// import { useLanguage } from "../context/LanguageContext";
// import { toCalendarEvents } from "../services/appointmentService";
// import { startOfWeek } from "../utils/calendar";
// import { SCHEDULING_STATE } from "../constants";

// export default function CalendarPage() {
//   const { currentUser, users, isAdmin } = useAuth();
//   const { isMentorMode, isMenteeMode } = useRoleMode();
//   const { Meetings, markUnavailable, getMeetingsForUser } = useScheduling();
//   const { t } = useLanguage();
//   const navigate = useNavigate();

//   const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
//   const [filter, setFilter] = useState("all");
//   const [selectedEvent, setSelectedEvent] = useState(null);

//   const role = isMentorMode ? "mentor" : "mentee";

//   const myMeetings = useMemo(() => {
//     if (!currentUser) return [];
//     const all = getMeetingsForUser(currentUser.id);
//     if (isMentorMode) return all.filter((s) => s.mentorId === currentUser.id);
//     if (isMenteeMode) return all.filter((s) => s.menteeId === currentUser.id);
//     return all;
//   }, [currentUser, getMeetingsForUser, isMentorMode, isMenteeMode, Meetings]);

//   const events = useMemo(() => {
//     let list = toCalendarEvents(myMeetings, { userId: currentUser?.id, role });
//     if (filter === "matched") list = list.filter((e) => e.type === "matched" || e.type === "completed");
//     if (filter === "proposed") list = list.filter((e) => e.type === "proposed");
//     if (filter === "pending") list = list.filter((e) => e.type === "pending");
//     return list;
//   }, [myMeetings, currentUser?.id, role, filter]);

//   useEffect(() => {
//     const firstTimed = events.find((e) => e.type !== "pending");
//     if (firstTimed) {
//       setWeekStart(startOfWeek(new Date(firstTimed.start)));
//     }
//   }, [role, currentUser?.id]);

//   if (isAdmin) return <Navigate to="/admin" replace />;

//   const meetingForEvent = selectedEvent
//     ? myMeetings.find((s) => s.id === selectedEvent.meetingId)
//     : null;
//   const mentor = meetingForEvent ? users.find((u) => String(u.id) === String(meetingForEvent.mentorId)) : null;
//   const mentee = meetingForEvent ? users.find((u) => String(u.id) === String(meetingForEvent.menteeId)) : null;
//   const actorName = `${currentUser.firstName} ${currentUser.lastName}`;

//   const pendingCount = myMeetings.filter(
//     (s) => s.schedulingState === SCHEDULING_STATE.PENDING_REQUEST
//   ).length;

//   return (
//     <MainLayout>
//       <PageHeader
//         title={isMentorMode ? t("calendar.mentorTitle") : t("calendar.menteeTitle")}
//         subtitle={isMentorMode ? t("calendar.mentorSubtitle") : t("calendar.menteeSubtitle")}
//       />

//       <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
//         <Chip label={`${t("calendar.legendBooked")}`} sx={{ bgcolor: "rgba(16,185,129,0.18)" }} />
//         <Chip label={`${t("calendar.legendProposed")}`} sx={{ bgcolor: "rgba(99,102,241,0.16)" }} />
//         <Chip label={`${t("calendar.legendPending")}`} sx={{ bgcolor: "rgba(245,158,11,0.18)" }} />
//         {pendingCount > 0 && isMentorMode && (
//           <Chip color="warning" label={t("calendar.pendingRequests", { count: pendingCount })} />
//         )}
//       </Stack>

//       <ToggleButtonGroup
//         exclusive
//         size="small"
//         value={filter}
//         onChange={(_, v) => v && setFilter(v)}
//         sx={{ mb: 2 }}
//       >
//         <ToggleButton value="all">{t("calendar.filterAll")}</ToggleButton>
//         <ToggleButton value="matched">{t("calendar.filterBooked")}</ToggleButton>
//         <ToggleButton value="proposed">{t("calendar.filterProposed")}</ToggleButton>
//         <ToggleButton value="pending">{t("calendar.filterPending")}</ToggleButton>
//       </ToggleButtonGroup>

//       {events.length === 0 && (
//         <Alert severity="info" sx={{ mb: 2 }}>
//           {t("calendar.empty")}
//         </Alert>
//       )}

//       <WeekCalendar
//         weekStart={weekStart}
//         onWeekChange={setWeekStart}
//         mode="view"
//         events={events.filter((e) => e.type !== "pending")}
//         onEventClick={setSelectedEvent}
//       />

//       {events.some((e) => e.type === "pending") && (
//         <Box sx={{ mt: 3 }}>
//           <Typography variant="subtitle1" fontWeight={700} gutterBottom>
//             {t("calendar.pendingList")}
//           </Typography>
//           <Stack spacing={1}>
//             {events
//               .filter((e) => e.type === "pending")
//               .map((event) => {
//                 const s = myMeetings.find((x) => x.id === event.meetingId);
//                 const other =
//                   role === "mentor"
//                     ? users.find((u) => String(u.id) === String(s?.menteeId))
//                     : users.find((u) => String(u.id) === String(s?.mentorId));
//                 return (
//                   <Alert
//                     key={event.id}
//                     severity="warning"
//                     action={
//                       <Chip
//                         size="small"
//                         label={t("calendar.openMeeting")}
//                         onClick={() => navigate("/Meetings")}
//                         clickable
//                       />
//                     }
//                   >
//                     {t("calendar.pendingItem", {
//                       name: other ? `${other.firstName} ${other.lastName}` : "",
//                     })}
//                   </Alert>
//                 );
//               })}
//           </Stack>
//         </Box>
//       )}

//       <MeetingEventDialog
//         open={Boolean(selectedEvent)}
//         event={selectedEvent}
//         meeting={meetingForEvent}
//         mentor={mentor}
//         mentee={mentee}
//         onClose={() => setSelectedEvent(null)}
//         onGoToMeeting={() => {
//           setSelectedEvent(null);
//           navigate("/Meetings");
//         }}
//         onMarkUnavailable={() => {
//           meetingForEvent &&
//           meetingForEvent.schedulingState === SCHEDULING_STATE.MATCHED
//             ? async () => {
//                 await markUnavailable(meetingForEvent.id, actorName);
//                 setSelectedEvent(null);
//                 navigate("/Meetings");
//               }
//             : undefined
//         }}
//         onReschedule={undefined}
//       />
//     </MainLayout>
//   );
// }

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { Navigate, useNavigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import PageHeader from "../components/common/PageHeader";
import WeekCalendar from "../components/calendar/WeekCalendar";
import MeetingEventDialog from "../components/calendar/MeetingEventDialog";
import { useAuth } from "../context/AuthContext";
import { useRoleMode } from "../context/RoleModeContext";
import { useScheduling } from "../context/SchedulingContext";
import { useLanguage } from "../context/LanguageContext";
import { toCalendarEvents } from "../services/appointmentService";
import { startOfWeek } from "../utils/calendar";
import { SCHEDULING_STATE } from "../constants";

export default function CalendarPage() {
  const { currentUser, users, isAdmin } = useAuth();
  const { isMentorMode, isMenteeMode } = useRoleMode();
  const { Meetings, markUnavailable, cancelMeeting, getMeetingsForUser, refreshMeetings } = useScheduling();

  useEffect(() => {
    refreshMeetings();
  }, [refreshMeetings, currentUser?.id, isMentorMode, isMenteeMode]);
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [filter, setFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const role = isMentorMode ? "mentor" : "mentee";

  const myMeetings = useMemo(() => {
    if (!currentUser) return [];
    const all = getMeetingsForUser(currentUser.id);
    if (isMentorMode) return all.filter((s) => String(s.mentorId) === String(currentUser.id));
    if (isMenteeMode) return all.filter((s) => String(s.menteeId) === String(currentUser.id));
    return all;
  }, [currentUser, getMeetingsForUser, isMentorMode, isMenteeMode, Meetings]);

  const events = useMemo(() => {
    let list = toCalendarEvents(myMeetings, { userId: currentUser?.id, role });
    if (filter === "matched") list = list.filter((e) => e.type === "matched" || e.type === "completed");
    if (filter === "proposed") list = list.filter((e) => e.type === "proposed");
    if (filter === "pending") list = list.filter((e) => e.type === "pending");
    return list;
  }, [myMeetings, currentUser?.id, role, filter]);

  useEffect(() => {
    const firstTimed = events.find((e) => e.type !== "pending");
    if (firstTimed) {
      setWeekStart(startOfWeek(new Date(firstTimed.start)));
    }
  }, [role, currentUser?.id]);

  if (isAdmin) return <Navigate to="/admin" replace />;

  const meetingForEvent = selectedEvent
    ? myMeetings.find((s) => s.id === selectedEvent.meetingId)
    : null;
  const mentor = meetingForEvent
    ? meetingForEvent.mentorDetails ||
      users.find((u) => String(u.id) === String(meetingForEvent.mentorId))
    : null;
  const mentee = meetingForEvent
    ? meetingForEvent.menteeDetails ||
      users.find((u) => String(u.id) === String(meetingForEvent.menteeId))
    : null;
  const actorName = `${currentUser.firstName} ${currentUser.lastName}`;
  const actorRole = isMentorMode ? "mentor" : "mentee";

  const pendingCount = myMeetings.filter(
    (s) => s.schedulingState === SCHEDULING_STATE.PENDING_REQUEST
  ).length;

  return (
    <MainLayout>
      <PageHeader
        title={isMentorMode ? t("calendar.mentorTitle") : t("calendar.menteeTitle")}
        subtitle={isMentorMode ? t("calendar.mentorSubtitle") : t("calendar.menteeSubtitle")}
      />

      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <Chip label={`${t("calendar.legendBooked")}`} sx={{ bgcolor: "rgba(16,185,129,0.18)" }} />
        <Chip label={`${t("calendar.legendProposed")}`} sx={{ bgcolor: "rgba(99,102,241,0.16)" }} />
        <Chip label={`${t("calendar.legendPending")}`} sx={{ bgcolor: "rgba(245,158,11,0.18)" }} />
        {pendingCount > 0 && isMentorMode && (
          <Chip color="warning" label={t("calendar.pendingRequests", { count: pendingCount })} />
        )}
      </Stack>

      <ToggleButtonGroup
        exclusive
        size="small"
        value={filter}
        onChange={(_, v) => v && setFilter(v)}
        sx={{ mb: 2 }}
      >
        <ToggleButton value="all">{t("calendar.filterAll")}</ToggleButton>
        <ToggleButton value="matched">{t("calendar.filterBooked")}</ToggleButton>
        <ToggleButton value="proposed">{t("calendar.filterProposed")}</ToggleButton>
        <ToggleButton value="pending">{t("calendar.filterPending")}</ToggleButton>
      </ToggleButtonGroup>

      {events.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("calendar.empty")}
        </Alert>
      )}

      <WeekCalendar
        weekStart={weekStart}
        onWeekChange={setWeekStart}
        mode="view"
        events={events.filter((e) => e.type !== "pending")}
        onEventClick={setSelectedEvent}
      />

      {events.some((e) => e.type === "pending") && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            {t("calendar.pendingList")}
          </Typography>
          <Stack spacing={1}>
            {events
              .filter((e) => e.type === "pending")
              .map((event) => {
                const s = myMeetings.find((x) => x.id === event.meetingId);
                const other =
                  role === "mentor"
                    ? users.find((u) => String(u.id) === String(s?.menteeId))
                    : users.find((u) => String(u.id) === String(s?.mentorId));
                return (
                  <Alert
                    key={event.id}
                    severity="warning"
                    action={
                      <Chip
                        size="small"
                        label={t("calendar.openMeeting")}
                        onClick={() => navigate("/Meetings")}
                        clickable
                      />
                    }
                  >
                    {t("calendar.pendingItem", {
                      name: other ? `${other.firstName} ${other.lastName}` : "",
                    })}
                  </Alert>
                );
              })}
          </Stack>
        </Box>
      )}

      <MeetingEventDialog
        open={Boolean(selectedEvent)}
        event={selectedEvent}
        meeting={meetingForEvent}
        mentor={mentor}
        mentee={mentee}
        onClose={() => setSelectedEvent(null)}
        onGoToMeeting={() => {
          setSelectedEvent(null);
          navigate("/Meetings");
        }}
        onCancel={
          meetingForEvent &&
          ![SCHEDULING_STATE.CANCELLED, SCHEDULING_STATE.COMPLETED].includes(
            meetingForEvent.schedulingState
          )
            ? async () => {
                await cancelMeeting(meetingForEvent.id, actorName);
                setSelectedEvent(null);
              }
            : undefined
        }
        onReschedule={
          meetingForEvent?.schedulingState === SCHEDULING_STATE.MATCHED &&
          !meetingForEvent?.rescheduleUsed
            ? async () => {
                await markUnavailable(meetingForEvent.id, actorRole);
                setSelectedEvent(null);
                navigate("/Meetings");
              }
            : undefined
        }
      />
    </MainLayout>
  );
}
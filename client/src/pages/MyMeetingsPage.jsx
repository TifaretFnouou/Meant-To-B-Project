// import React, { useMemo, useState } from "react";
// import {
//   Typography,
//   Tabs,
//   Tab,
//   Box,
//   Alert,
// } from "@mui/material";
// import { Navigate } from "react-router-dom";
// import MainLayout from "../components/layout/MainLayout";
// import PageHeader from "../components/common/PageHeader";
// import MeetingschedulingPanel from "../components/scheduling/MeetingschedulingPanel";
// import FeedbackDialog from "../components/feedback/FeedbackDialog";
// import AttendanceDialog from "../components/feedback/AttendanceDialog";
// import { useAuth } from "../context/AuthContext";
// import { useRoleMode } from "../context/RoleModeContext";
// import { useScheduling } from "../context/SchedulingContext";
// import { useLanguage } from "../context/LanguageContext";
// import { MEETING_STATUS, SCHEDULING_STATE } from "../constants";

// function categorizeMeetings(Meetings) {
//   const now = new Date();
//   const upcoming = [];
//   const planned = [];
//   const past = [];

//   Meetings.forEach((s) => {
//     if (s.status === MEETING_STATUS.COMPLETED || s.schedulingState === SCHEDULING_STATE.COMPLETED) {
//       past.push(s);
//     } else if (s.matchedSlot && new Date(s.matchedSlot) > now) {
//       upcoming.push(s);
//     } else if (s.status === MEETING_STATUS.MATCHED) {
//       planned.push(s);
//     } else {
//       planned.push(s);
//     }
//   });

//   return { upcoming, planned, past };
// }

// export default function MyMeetingsPage() {
//   const { currentUser, users, isAdmin } = useAuth();
//   const { isMenteeMode, isMentorMode } = useRoleMode();
//   const { getMeetingsForUser, Meetings } = useScheduling();
//   const [tab, setTab] = useState(0);
//   const [feedbackMeeting, setFeedbackMeeting] = useState(null);
//   const [attendanceMeeting, setAttendanceMeeting] = useState(null);

//   const { t } = useLanguage();

//   const allMeetings = getMeetingsForUser(currentUser?.id);
//   const myMeetings = useMemo(() => {
//     if (!currentUser) return [];
//     if (isMenteeMode) {
//       return allMeetings.filter((s) => s.menteeId === currentUser.id);
//     }
//     if (isMentorMode) {
//       return allMeetings.filter((s) => s.mentorId === currentUser.id);
//     }
//     return allMeetings;
//   }, [allMeetings, currentUser, isMenteeMode, isMentorMode]);
//   const { upcoming, planned, past } = useMemo(
//     () => categorizeMeetings(myMeetings),
//     [myMeetings, Meetings]
//   );

//   if (isAdmin) {
//     return <Navigate to="/admin" replace />;
//   }

//   const getUser = (id) => users.find((u) => u.id === id);

//   const tabMeetings = [upcoming, planned, past][tab] || [];

//   const needsFeedback = (meeting) => {
//     const role = currentUser.id === meeting.mentorId ? "mentor" : "mentee";
//     if (role === "mentor" && !isMentorMode) return false;
//     if (role === "mentee" && !isMenteeMode) return false;
//     return (
//       meeting.schedulingState === SCHEDULING_STATE.COMPLETED &&
//       !meeting.feedback?.[role]
//     );
//   };

//   const needsAttendance = (meeting) => {
//     const role = currentUser.id === meeting.mentorId ? "mentor" : "mentee";
//     if (role === "mentor" && !isMentorMode) return false;
//     if (role === "mentee" && !isMenteeMode) return false;
//     const slotPassed = meeting.matchedSlot && new Date(meeting.matchedSlot) < new Date();
//     return (
//       slotPassed &&
//       meeting.schedulingState === SCHEDULING_STATE.MATCHED &&
//       meeting.attendance?.[role] === null
//     );
//   };

//   return (
//     <MainLayout>
//       <PageHeader
//         title={isMentorMode ? t("nav.MeetingsAsMentor") : t("Meetings.title")}
//         subtitle={isMentorMode ? t("mode.mentoringDesc") : t("mode.MenteeDesc")}
//       />

//       <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
//         <Tab label={`${t("Meetings.upcoming")} (${upcoming.length})`} />
//         <Tab label={`${t("Meetings.planned")} (${planned.length})`} />
//         <Tab label={`${t("Meetings.past")} (${past.length})`} />
//       </Tabs>

//       {tabMeetings.length === 0 && (
//         <Alert severity="info">
//           {isMentorMode ? t("Meetings.emptyMentor") : t("Meetings.emptyMentee")}
//         </Alert>
//       )}

//       {tabMeetings.map((meeting) => {
//         const mentor = getUser(meeting.mentorId);
//         const mentee = getUser(meeting.menteeId);
//         return (
//           <Box key={meeting.id}>
//             <MeetingschedulingPanel
//               meeting={meeting}
//               mentor={mentor}
//               mentee={mentee}
//             />
//             {needsAttendance(meeting) && (
//               <Alert
//                 severity="warning"
//                 action={
//                   <button
//                     type="button"
//                     onClick={() => setAttendanceMeeting(meeting)}
//                     style={{ cursor: "pointer", border: "none", background: "none", color: "#ed6c02", fontWeight: 600 }}
//                   >
//                     {t("Meetings.confirmAttendance")}
//                   </button>
//                 }
//                 sx={{ mb: 2 }}
//               >
//                 האם הפגישה התקיימה?
//               </Alert>
//             )}
//             {needsFeedback(meeting) && (
//               <Alert
//                 severity="info"
//                 action={
//                   <button
//                     type="button"
//                     onClick={() => setFeedbackMeeting(meeting)}
//                     style={{ cursor: "pointer", border: "none", background: "none", color: "#1976d2", fontWeight: 600 }}
//                   >
//                     {t("Meetings.fillFeedback")}
//                   </button>
//                 }
//                 sx={{ mb: 2 }}
//               >
//                 נדרש משוב על הפגישה
//               </Alert>
//             )}
//           </Box>
//         );
//       })}

//       <FeedbackDialog
//         open={Boolean(feedbackMeeting)}
//         meeting={feedbackMeeting}
//         onClose={() => setFeedbackMeeting(null)}
//       />
//       <AttendanceDialog
//         open={Boolean(attendanceMeeting)}
//         meeting={attendanceMeeting}
//         onClose={() => setAttendanceMeeting(null)}
//       />
//     </MainLayout>
//   );
// }


import React, { useMemo, useState } from "react";
import {
  Typography,
  Tabs,
  Tab,
  Box,
  Alert,
} from "@mui/material";
import { Navigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import PageHeader from "../components/common/PageHeader";
import MeetingschedulingPanel from "../components/scheduling/MeetingsSchedulingPanel";
import FeedbackDialog from "../components/feedback/FeedbackDialog";
import AttendanceDialog from "../components/feedback/AttendanceDialog";
import { useAuth } from "../context/AuthContext";
import { useRoleMode } from "../context/RoleModeContext";
import { useScheduling } from "../context/SchedulingContext";
import { useLanguage } from "../context/LanguageContext";
import { MEETING_STATUS, SCHEDULING_STATE } from "../constants";

// categorize the Meetings according to the statuses of the server
function categorizeMeetings(Meetings) {
  const upcoming = []; // Meetings that have been assigned a time (MATCHED)
  const planned = []; // Meetings that are waiting for action (PENDING)
  const past = []; // Meetings that have been completed or cancelled

  Meetings.forEach((s) => {
    const status = s.status || "";
    
    if (
      status === MEETING_STATUS.COMPLETED || 
      status === MEETING_STATUS.CANCELLED || 
      status === "FEEDBACK_FILLED" ||
      s.schedulingState === SCHEDULING_STATE.COMPLETED ||
      s.schedulingState === SCHEDULING_STATE.CANCELLED
    ) {
      past.push(s);
    } else if (status === MEETING_STATUS.MATCHED || s.schedulingState === SCHEDULING_STATE.MATCHED) {
      upcoming.push(s);
    } else {
      // everything that doesn't fit into the above categories is considered "in progress"
      planned.push(s);
    }
  });

  return { upcoming, planned, past };
}

export default function MyMeetingsPage() {
  const { currentUser, users, isAdmin } = useAuth();
  const { isMenteeMode, isMentorMode } = useRoleMode();
  const { getMeetingsForUser, Meetings } = useScheduling();
  const [tab, setTab] = useState(0);
  const [feedbackMeeting, setFeedbackMeeting] = useState(null);
  const [attendanceMeeting, setAttendanceMeeting] = useState(null);

  const { t } = useLanguage();

  const allMeetings = getMeetingsForUser(currentUser?.id);
  const myMeetings = useMemo(() => {
    if (!currentUser) return [];
    if (isMenteeMode) {
      return allMeetings.filter((s) => String(s.menteeId) === String(currentUser.id));
    }
    if (isMentorMode) {
      return allMeetings.filter((s) => String(s.mentorId) === String(currentUser.id));
    }
    return allMeetings;
  }, [allMeetings, currentUser, isMenteeMode, isMentorMode]);

  const { upcoming, planned, past } = useMemo(
    () => categorizeMeetings(myMeetings),
    [myMeetings]
  );

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // fallback function in case the server didn't return a full object
  const getUser = (id) => users.find((u) => String(u.id) === String(id));

  // note the order of the tabs (must match the tabs below)
  const tabMeetings = [planned, upcoming, past][tab] || [];

  const needsFeedback = (meeting) => {
    const role = String(currentUser.id) === String(meeting.mentorId) ? "mentor" : "mentee";
    if (role === "mentor" && !isMentorMode) return false;
    if (role === "mentee" && !isMenteeMode) return false;
    return (
      (meeting.status === MEETING_STATUS.COMPLETED || meeting.schedulingState === SCHEDULING_STATE.COMPLETED) &&
      !meeting.feedback?.[role]
    );
  };

  const needsAttendance = (meeting) => {
    const role = String(currentUser.id) === String(meeting.mentorId) ? "mentor" : "mentee";
    if (role === "mentor" && !isMentorMode) return false;
    if (role === "mentee" && !isMenteeMode) return false;
    
    const slotPassed = meeting.matchedSlot && new Date(meeting.matchedSlot) < new Date();
    
    return (
      slotPassed &&
      (meeting.status === MEETING_STATUS.MATCHED || meeting.schedulingState === SCHEDULING_STATE.MATCHED) &&
      meeting.attendance?.[role] === null
    );
  };

  return (
    <MainLayout>
      <PageHeader
        title={isMentorMode ? t("nav.MeetingsAsMentor") : t("Meetings.title")}
        subtitle={isMentorMode ? t("mode.mentoringDesc") : t("mode.MenteeDesc")}
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label={`${t("Meetings.planned")} (${planned.length})`} />
        <Tab label={`${t("Meetings.upcoming")} (${upcoming.length})`} />
        <Tab label={`${t("Meetings.past")} (${past.length})`} />
      </Tabs>

      {tabMeetings.length === 0 && (
        <Alert severity="info">
          {isMentorMode ? t("Meetings.emptyMentor") : t("Meetings.emptyMentee")}
        </Alert>
      )}

      {tabMeetings.map((meeting) => {
        // use the data that came directly from the populated meeting, and only if missing, look for local data
        const mentor = meeting.mentorDetails || getUser(meeting.mentorId);
        const mentee = meeting.menteeDetails || getUser(meeting.menteeId);
        
        return (
          <Box key={meeting.id} sx={{ mb: 3 }}>
            <MeetingschedulingPanel
              meeting={meeting}
              mentor={mentor}
              mentee={mentee}
            />
            {needsAttendance(meeting) && (
              <Alert
                severity="warning"
                action={
                  <button
                    type="button"
                    onClick={() => setAttendanceMeeting(meeting)}
                    style={{ cursor: "pointer", border: "none", background: "none", color: "#ed6c02", fontWeight: 600 }}
                  >
                    {t("Meetings.confirmAttendance")}
                  </button>
                }
                sx={{ mb: 2, mt: 1 }}
              >
                Did the meeting take place?
              </Alert>
            )}
            {needsFeedback(meeting) && (
              <Alert
                severity="info"
                action={
                  <button
                    type="button"
                    onClick={() => setFeedbackMeeting(meeting)}
                    style={{ cursor: "pointer", border: "none", background: "none", color: "#1976d2", fontWeight: 600 }}
                  >
                    {t("Meetings.fillFeedback")}
                  </button>
                }
                sx={{ mb: 2, mt: 1 }}
              >
                Feedback is required on the meeting
              </Alert>
            )}
          </Box>
        );
      })}

      <FeedbackDialog
        open={Boolean(feedbackMeeting)}
        meeting={feedbackMeeting}
        onClose={() => setFeedbackMeeting(null)}
      />
      <AttendanceDialog
        open={Boolean(attendanceMeeting)}
        meeting={attendanceMeeting}
        onClose={() => setAttendanceMeeting(null)}
      />
    </MainLayout>
  );
}
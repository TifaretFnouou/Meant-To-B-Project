
// import React from "react";
// import {
//   Card,
//   CardContent,
//   CardActions,
//   Typography,
//   Chip,
//   Button,
//   Box,
//   Stack,
// } from "@mui/material";
// import WorkIcon from "@mui/icons-material/Work";
// import TimerIcon from "@mui/icons-material/Timer";
// import EventIcon from "@mui/icons-material/Event";
// import { useLanguage } from "../../context/LanguageContext";
// import { brand } from "../../theme/brand";
// import UserAvatar from "../common/UserAvatar";

// export default function MentorCard({
//   mentor,
//   onExpressInterest,
//   hasPendingRequest,
//   canExpressInterest = true,
// }) {
//   const { t } = useLanguage();
//   const profile = mentor.mentorProfile;
//   return (
//     <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
//       {}
//       <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
//         <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
//           <UserAvatar user={mentor} size={52} />
//           <Box sx={{ minWidth: 0 }}>
//             <Typography variant="h6" fontWeight={700}>
//               {mentor.firstName} {mentor.lastName}
//             </Typography>
//             <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
//               {mentor.jobTitle} · {mentor.company}
//             </Typography>
//           </Box>
//         </Box>

//         <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
//           {profile?.bio}
//         </Typography>

//         {}
//         <Stack direction="row" spacing={0.5} sx={{ mt: "auto", mb: 1, flexWrap: "wrap", gap: 0.5 }}>
//           {profile?.topics?.map((topic) => (
//             <Chip key={topic} label={topic} size="small" color="primary" variant="outlined" />
//           ))}
//         </Stack>

//         <Stack direction="row" spacing={2} sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}>
//           <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
//             <WorkIcon fontSize="small" sx={{ color: brand.dustyRose }} />
//             <Typography variant="caption">{mentor.yearsOfExperience} {t("mentors.yearsExp")}</Typography>
//           </Box>
//           <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
//             <EventIcon fontSize="small" sx={{ color: brand.dustyRose }} />
//             <Typography variant="caption">{t("mentors.maxMeetings", { count: profile?.maxMeetings })}</Typography>
//           </Box>
//           <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
//             <TimerIcon fontSize="small" sx={{ color: brand.dustyRose }} />
//             <Typography variant="caption">{t("mentors.meetingLength", { min: profile?.meetingLengthMinutes })}</Typography>
//           </Box>
//         </Stack>

//         <Stack direction="row" spacing={0.5} sx={{ mt: 1.5, flexWrap: "wrap", gap: 0.5 }}>
//           {mentor.techStack?.map((tech) => (
//             <Chip key={tech} label={tech} size="small" />
//           ))}
//         </Stack>
//       </CardContent>
//       <CardActions sx={{ p: 2, pt: 0 }}>
//         {canExpressInterest ? (
//           <Button
//             fullWidth
//             variant="contained"
//             onClick={() => onExpressInterest(mentor)}
//             disabled={hasPendingRequest}
//           >
//             {hasPendingRequest ? t("mentors.requestPending") : t("mentors.expressInterest")}
//           </Button>
//         ) : (
//           <Button fullWidth variant="outlined" disabled>
//             {t("mentors.browseOnly")}
//           </Button>
//         )}
//       </CardActions>
//     </Card>
//   );
// }





import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Button,
  Box,
  Stack,
  CircularProgress,
  Snackbar,
  Alert
} from "@mui/material";
import WorkIcon from "@mui/icons-material/Work";
import TimerIcon from "@mui/icons-material/Timer";
import EventIcon from "@mui/icons-material/Event";
import { useLanguage } from "../../context/LanguageContext";
import { brand } from "../../theme/brand";
import UserAvatar from "../common/UserAvatar";
// --- import our appointment service ---
import { appointmentService } from "../../services/appointmentService";
import { useNotifications } from "../../context/NotificationContext";

export default function MentorCard({
  mentor,
  onExpressInterest,
  hasPendingRequest,
  canExpressInterest = true,
}) {
  const { t } = useLanguage();
  const profile = mentor.mentorProfile;
  const { addNotification } = useNotifications(); 

  // --- manage the state for loading and messages to the user ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: "", severity: "success" });

  const handleCloseFeedback = () => setFeedback(prev => ({ ...prev, open: false }));

  // --- the function that calls the server when the user clicks "book meeting" ---
  // const handleBookMeeting = async () => {
  //   setIsSubmitting(true);
  //   try {
  //     // 1. call the real server using the mentor's id
  //     await appointmentService.createMentorshipRequest({ mentorId: mentor.id });
      
  //     // 2. success message
  //     setFeedback({
  //       open: true,
  //       message: "The request has been sent successfully to the mentor! You can track it in your personal area.",
  //       severity: "success"
  //     });

  //     // 3. update the catalog page (to prevent multiple submissions in the same meeting)
  //     if (onExpressInterest) {
  //       onExpressInterest(mentor); 
  //     }
  //   } catch (error) {
  //     // error message (e.g. if there is an active meeting)
  //     setFeedback({
  //       open: true,
  //       message: error.response?.data?.error || error.message || "An error occurred while sending the request.",
  //       severity: "error"
  //     });
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  const handleBookMeeting = async () => {
    setIsSubmitting(true);
    try {
      // 1. call the server to create the meeting request
      const response = await appointmentService.createMentorshipRequest({ mentorId: mentor.id });
  
      // 2. create the notification for the mentor
      addNotification(
        mentor.id, 
        "A new meeting request has been received from a mentee.", 
        { menteeName: "Mentee" }, // can put the name of the logged in user if available
        response?.id || null
      );
  
      // 3. success message
      setFeedback({
        open: true,
        message: "The request has been sent successfully to the mentor! You can track it in your personal area.",
        severity: "success"
      });
  
      if (onExpressInterest) {
        onExpressInterest(mentor); 
      }
    } catch (error) {
      setFeedback({
        open: true,
        message: error.response?.data?.error || error.message || "An error occurred while sending the request.",
        severity: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <UserAvatar user={mentor} size={52} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={700}>
              {mentor.firstName} {mentor.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
              {mentor.jobTitle} · {mentor.company}
            </Typography>
          </Box>
        </Box>

        <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
          {profile?.bio}
        </Typography>

        <Stack direction="row" spacing={0.5} sx={{ mt: "auto", mb: 1, flexWrap: "wrap", gap: 0.5 }}>
          {profile?.topics?.map((topic) => (
            <Chip key={topic} label={topic} size="small" color="primary" variant="outlined" />
          ))}
        </Stack>

        <Stack direction="row" spacing={2} sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <WorkIcon fontSize="small" sx={{ color: brand.dustyRose }} />
            <Typography variant="caption">{mentor.yearsOfExperience} {t("mentors.yearsExp")}</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <EventIcon fontSize="small" sx={{ color: brand.dustyRose }} />
            <Typography variant="caption">{t("mentors.maxMeetings", { count: profile?.maxMeetings })}</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <TimerIcon fontSize="small" sx={{ color: brand.dustyRose }} />
            <Typography variant="caption">{t("mentors.meetingLength", { min: profile?.meetingLengthMinutes })}</Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.5} sx={{ mt: 1.5, flexWrap: "wrap", gap: 0.5 }}>
          {mentor.techStack?.map((tech) => (
            <Chip key={tech} label={tech} size="small" />
          ))}
        </Stack>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        {canExpressInterest ? (
          <Button
            fullWidth
            variant="contained"
            onClick={handleBookMeeting}
            // the button is disabled if we are waiting for a response from the server or if there is an active request
            disabled={hasPendingRequest || isSubmitting}
          >
            {/* if we are waiting for the server to respond, show a loading animation */}
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : hasPendingRequest ? (
              t("mentors.requestPending")
            ) : (
              t("mentors.expressInterest")
            )}
          </Button>
        ) : (
          <Button fullWidth variant="outlined" disabled>
            {t("mentors.browseOnly")}
          </Button>
        )}
      </CardActions>

        {/* --- element to display the success/error message --- */}
      <Snackbar
        open={feedback.open}
        autoHideDuration={5000}
        onClose={handleCloseFeedback}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseFeedback} severity={feedback.severity} sx={{ width: "100%" }}>
          {feedback.message}
        </Alert>
      </Snackbar>
    </Card>
  );
}
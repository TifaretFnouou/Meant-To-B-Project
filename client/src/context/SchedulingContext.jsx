// import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
// import appointmentService from "../services/appointmentService";
// import { useNotifications } from "./NotificationContext";

// const SchedulingContext = createContext(null);

// export function SchedulingProvider({ children }) {
//   const [Meetings, setMeetings] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const { addNotification } = useNotifications();

//   const refresh = useCallback(async () => {
//     const data = await appointmentService.getAppointments();
//     setMeetings(data);
//     setLoading(false);
//   }, []);

//   useEffect(() => {
//     refresh();
//   }, [refresh]);

//   const createRequest = async (mentorId, menteeId, menteeName, durationMinutes = 60) => {
//     const meeting = await appointmentService.createMentorshipRequest({
//       mentorId,
//       menteeId,
//       durationMinutes,
//     });
//     await refresh();
//     addNotification(mentorId, "notif.mentorshipRequest", { name: menteeName }, meeting.id);
//     return meeting;
//   };

//   const approveRequest = async (meetingId, mentorName) => {
//     const meeting = await appointmentService.approveRequest(meetingId);
//     await refresh();
//     addNotification(meeting.menteeId, "notif.requestApproved", { name: mentorName }, meetingId);
//     return meeting;
//   };

//   const rejectRequest = async (meetingId, mentorName) => {
//     const meeting = await appointmentService.rejectRequest(meetingId);
//     await refresh();
//     addNotification(meeting.menteeId, "notif.requestRejected", { name: mentorName }, meetingId);
//     return meeting;
//   };

//   const proposeSlots = async (meetingId, slots, mentorName) => {
//     const meeting = await appointmentService.proposeSlots(meetingId, slots);
//     await refresh();
//     addNotification(meeting.menteeId, "notif.slotsProposed", { name: mentorName }, meetingId);
//     return meeting;
//   };

//   const selectSlot = async (meetingId, slot, menteeName) => {
//     const meeting = await appointmentService.bookSlot(meetingId, slot);
//     await refresh();
//     addNotification(meeting.mentorId, "notif.slotSelected", { name: menteeName }, meetingId);
//     return meeting;
//   };

//   const requestMoreSlots = async (meetingId, menteeName) => {
//     const { meeting, cancelled } = await appointmentService.requestMoreSlots(meetingId);
//     await refresh();
//     if (cancelled) {
//       addNotification(meeting.mentorId, "notif.requestCancelled", { name: menteeName }, meetingId);
//     } else {
//       addNotification(meeting.mentorId, "notif.moreSlotsRequested", { name: menteeName }, meetingId);
//     }
//     return meeting;
//   };

//   const cancelMeeting = async (meetingId, actorName) => {
//     const meeting = await appointmentService.cancelAppointment(meetingId);
//     await refresh();
//     addNotification(meeting.mentorId, "notif.meetingCancelled", { name: actorName }, meetingId);
//     addNotification(meeting.menteeId, "notif.meetingCancelled", { name: actorName }, meetingId);
//     return meeting;
//   };

//   const markUnavailable = async (meetingId, role) => {
//     const meeting = await appointmentService.markUnavailable(meetingId);
//     await refresh();
//     const target = role === "mentor" ? meeting.menteeId : meeting.mentorId;
//     addNotification(target, "notif.rescheduleNeeded", {}, meetingId);
//     return meeting;
//   };

//   const submitAttendance = async (meetingId, role, attended) => {
//     const meeting = await appointmentService.submitAttendance(meetingId, role, attended);
//     await refresh();
//     return meeting;
//   };

//   const submitFeedback = async (meetingId, role, feedback) => {
//     const meeting = await appointmentService.submitFeedback(meetingId, role, feedback);
//     await refresh();
//     return meeting;
//   };

//   const getMeetingsForUser = (userId) =>
//     Meetings.filter((s) => s.mentorId === userId || s.menteeId === userId);

//   const getCalendarEvents = async (userId, role) =>
//     appointmentService.getCalendarEvents(userId, role);

//   const getMentorAvailability = async (mentorId) =>
//     appointmentService.getMentorAvailability(mentorId);

//   const value = useMemo(
//     () => ({
//       Meetings,
//       loading,
//       refresh,
//       createRequest,
//       approveRequest,
//       rejectRequest,
//       proposeSlots,
//       selectSlot,
//       requestMoreSlots,
//       cancelMeeting,
//       markUnavailable,
//       submitAttendance,
//       submitFeedback,
//       getMeetingsForUser,
//       getCalendarEvents,
//       getMentorAvailability,
//       mapSchedulingToMeetingstatus: appointmentService.mapSchedulingToMeetingstatus,
//     }),
//     [Meetings, loading, refresh]
//   );

//   return (
//     <SchedulingContext.Provider value={value}>{children}</SchedulingContext.Provider>
//   );
// }

// export function useScheduling() {
//   const ctx = useContext(SchedulingContext);
//   if (!ctx) {
//     throw new Error("useScheduling must be used within SchedulingProvider");
//   }
//   return ctx;
// }

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import appointmentService from "../services/appointmentService";
import { useNotifications } from "./NotificationContext";

const SchedulingContext = createContext(null);

// fallback in case the old UI tries to use a function that is no longer relevant to the server
const fallbackMapStatus = (state) => state;

export function SchedulingProvider({ children }) {
  const [Meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();

  // fetch the Meetings of the logged in user from the server
  const refreshMeetings = useCallback(async () => {
    try {
      const data = await appointmentService.getAppointmentsForUser();
      setMeetings(data || []);
    } catch (error) {
      console.error("Failed to fetch Meetings from server:", error);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMeetings();
  }, [refreshMeetings]);

  const createRequest = async (mentorId, menteeId, menteeName, durationMinutes = 60) => {
    // the server only requires mentorId, the mentor is identified from the token
    const meeting = await appointmentService.createMentorshipRequest({ mentorId });
    await refreshMeetings();
    addNotification(mentorId, "notif.mentorshipRequest", { name: menteeName }, meeting.id);
    return meeting;
  };

  // in the new server flow, there is no "approval" step. The approval happens as soon as the mentor proposes times.
  // we keep the function so old components don't crash.
  const approveRequest = async (meetingId, mentorName) => {
    console.warn("approveRequest is deprecated. Mentors should directly propose times.");
    return Meetings.find(s => s.id === meetingId);
  };

  const rejectRequest = async (meetingId, mentorName) => {
    const meeting = await appointmentService.rejectRequest(meetingId);
    await refreshMeetings();
    addNotification(meeting.menteeId, "notif.requestRejected", { name: mentorName }, meetingId);
    return meeting;
  };

  const proposeSlots = async (meetingId, slots, mentorName) => {
    const meeting = await appointmentService.proposeSlots(meetingId, slots);
    await refreshMeetings();
    addNotification(meeting.menteeId, "notif.slotsProposed", { name: mentorName }, meetingId);
    return meeting;
  };

  const selectSlot = async (meetingId, slot, menteeName) => {
    const meeting = await appointmentService.bookSlot(meetingId, slot);
    await refreshMeetings();
    addNotification(meeting.mentorId, "notif.slotSelected", { name: menteeName }, meetingId);
    return meeting;
  };

  const requestMoreSlots = async (meetingId, menteeName) => {
    const { meeting, cancelled } = await appointmentService.requestMoreSlots(meetingId);
    await refreshMeetings();
    if (cancelled) {
      addNotification(meeting.mentorId, "notif.requestCancelled", { name: menteeName }, meetingId);
    } else {
      addNotification(meeting.mentorId, "notif.moreSlotsRequested", { name: menteeName }, meetingId);
    }
    return meeting;
  };

  const cancelMeeting = async (meetingId, actorName) => {
    const meeting = await appointmentService.cancelAppointment(meetingId);
    await refreshMeetings();
    
    // send notifications (safely, in case the object is missing)
    if (meeting.mentorId) addNotification(meeting.mentorId, "notif.meetingCancelled", { name: actorName }, meetingId);
    if (meeting.menteeId) addNotification(meeting.menteeId, "notif.meetingCancelled", { name: actorName }, meetingId);
    
    return meeting;
  };

  const markUnavailable = async (meetingId, role) => {
    console.warn("markUnavailable not fully implemented in backend yet");
    return Meetings.find(s => s.id === meetingId);
  };

  const submitAttendance = async (meetingId, role, attended) => {
    const meeting = await appointmentService.submitAttendance(meetingId, role, attended);
    await refreshMeetings();
    return meeting;
  };

  const submitFeedback = async (meetingId, role, feedback) => {
    const meeting = await appointmentService.submitFeedback(meetingId, role, feedback);
    await refreshMeetings();
    return meeting;
  };

  // used to be here, but the server now returns *only* the Meetings of the logged in user
  const getMeetingsForUser = (userId) => Meetings;

  const getCalendarEvents = async (userId, role) =>
    appointmentService.getCalendarEvents(userId, role);

  const getMentorAvailability = async (mentorId) => {
    // return empty data for now to prevent the old log component from crashing
    return { busy: [], proposed: [], Meetings: [] };
  };

  const value = useMemo(
    () => ({
      Meetings,
      loading,
      refresh: refreshMeetings, // expose both names for perfect match with your code
      refreshMeetings,
      createRequest,
      approveRequest,
      rejectRequest,
      proposeSlots,
      selectSlot,
      requestMoreSlots,
      cancelMeeting,
      markUnavailable,
      submitAttendance,
      submitFeedback,
      getMeetingsForUser,
      getCalendarEvents,
      getMentorAvailability,
      mapSchedulingToMeetingstatus: appointmentService.mapSchedulingToMeetingstatus || fallbackMapStatus,
    }),
    [Meetings, loading, refreshMeetings]
  );

  return (
    <SchedulingContext.Provider value={value}>{children}</SchedulingContext.Provider>
  );
}

export function useScheduling() {
  const ctx = useContext(SchedulingContext);
  if (!ctx) {
    throw new Error("useScheduling must be used within SchedulingProvider");
  }
  return ctx;
}
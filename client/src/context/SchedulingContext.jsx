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
import { getStoredToken } from "../services/api";
import { useAuth } from "./AuthContext";
import { useNotifications } from "./NotificationContext";

const SchedulingContext = createContext(null);

// fallback in case the old UI tries to use a function that is no longer relevant to the server
const fallbackMapStatus = (state) => state;

export function SchedulingProvider({ children }) {
  const [Meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();
  const { currentUser, authReady } = useAuth();

  // fetch the Meetings of the logged in user from the server
  const refreshMeetings = useCallback(async () => {
    if (!getStoredToken()) {
      setMeetings([]);
      setLoading(false);
      return [];
    }

    try {
      const data = await appointmentService.getAppointmentsForUser();
      setMeetings(data || []);
      return data || [];
    } catch (error) {
      console.error("Failed to fetch Meetings from server:", error);
      setMeetings([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Must re-fetch when auth becomes ready / user switches — provider stays mounted across login.
  useEffect(() => {
    if (!authReady) return;

    if (!currentUser) {
      setMeetings([]);
      setLoading(false);
      return;
    }

    refreshMeetings();
  }, [authReady, currentUser?.id, refreshMeetings]);

  const createRequest = async (mentorId, menteeId, menteeName, durationMinutes = 60) => {
    // the server only requires mentorId; the mentee is identified from the token
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
    if (!Array.isArray(slots) || slots.length === 0) {
      throw new Error("Please select at least one time slot");
    }
    if (slots.length > 3) {
      throw new Error("You can propose up to 3 time options");
    }
    const meeting = await appointmentService.proposeSlots(meetingId, slots);
    await refreshMeetings();
    if (meeting.menteeId) {
      addNotification(meeting.menteeId, "notif.slotsProposed", { name: mentorName }, meetingId);
    }
    return meeting;
  };

  const selectSlot = async (meetingId, slot, menteeName) => {
    // Prefer exact endTime from the mentor's proposal when available
    const existing = Meetings.find((m) => String(m.id) === String(meetingId));
    const proposed = existing?.proposedTimes?.find(
      (pt) => new Date(pt.startTime).getTime() === new Date(slot).getTime()
    );
    const durationMinutes = proposed
      ? Math.max(
          15,
          Math.round((new Date(proposed.endTime) - new Date(proposed.startTime)) / 60000)
        )
      : existing?.durationMinutes || 60;

    const meeting = await appointmentService.bookSlot(meetingId, slot, durationMinutes);
    await refreshMeetings();
    // Notify both sides: a new meeting was scheduled
    if (meeting.mentorId) {
      addNotification(meeting.mentorId, "notif.meetingScheduled", { name: menteeName }, meetingId);
    }
    if (meeting.menteeId) {
      const mentorLabel = meeting.mentorDetails
        ? `${meeting.mentorDetails.firstName || ""} ${meeting.mentorDetails.lastName || ""}`.trim()
        : "";
      addNotification(
        meeting.menteeId,
        "notif.meetingScheduled",
        { name: mentorLabel || "mentor" },
        meetingId
      );
    }
    return meeting;
  };

  const requestMoreSlots = async (meetingId, menteeName) => {
    const { meeting, cancelled } = await appointmentService.requestMoreSlots(meetingId);
    await refreshMeetings();
    if (meeting?.mentorId) {
      if (cancelled) {
        addNotification(meeting.mentorId, "notif.requestCancelled", { name: menteeName }, meetingId);
      } else {
        addNotification(meeting.mentorId, "notif.moreSlotsRequested", { name: menteeName }, meetingId);
      }
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
    const { meeting, cancelled } = await appointmentService.markUnavailable(meetingId);
    await refreshMeetings();
    if (cancelled) {
      if (meeting.mentorId) {
        addNotification(meeting.mentorId, "notif.meetingCancelled", {}, meetingId);
      }
      if (meeting.menteeId) {
        addNotification(meeting.menteeId, "notif.meetingCancelled", {}, meetingId);
      }
    } else {
      const target = role === "mentor" ? meeting.menteeId : meeting.mentorId;
      if (target) addNotification(target, "notif.rescheduleNeeded", {}, meetingId);
    }
    return meeting;
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
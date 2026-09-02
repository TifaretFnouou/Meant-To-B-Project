import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import appointmentService from "../services/appointmentService";
import { useNotifications } from "./NotificationContext";

const SchedulingContext = createContext(null);

export function SchedulingProvider({ children }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();

  const refresh = useCallback(async () => {
    const data = await appointmentService.getAppointments();
    setSessions(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createRequest = async (mentorId, menteeId, menteeName, durationMinutes = 60) => {
    const session = await appointmentService.createMentorshipRequest({
      mentorId,
      menteeId,
      durationMinutes,
    });
    await refresh();
    addNotification(mentorId, "notif.mentorshipRequest", { name: menteeName }, session.id);
    return session;
  };

  const approveRequest = async (sessionId, mentorName) => {
    const session = await appointmentService.approveRequest(sessionId);
    await refresh();
    addNotification(session.menteeId, "notif.requestApproved", { name: mentorName }, sessionId);
    return session;
  };

  const rejectRequest = async (sessionId, mentorName) => {
    const session = await appointmentService.rejectRequest(sessionId);
    await refresh();
    addNotification(session.menteeId, "notif.requestRejected", { name: mentorName }, sessionId);
    return session;
  };

  const proposeSlots = async (sessionId, slots, mentorName) => {
    const session = await appointmentService.proposeSlots(sessionId, slots);
    await refresh();
    addNotification(session.menteeId, "notif.slotsProposed", { name: mentorName }, sessionId);
    return session;
  };

  const selectSlot = async (sessionId, slot, menteeName) => {
    const session = await appointmentService.bookSlot(sessionId, slot);
    await refresh();
    addNotification(session.mentorId, "notif.slotSelected", { name: menteeName }, sessionId);
    return session;
  };

  const requestMoreSlots = async (sessionId, menteeName) => {
    const { session, cancelled } = await appointmentService.requestMoreSlots(sessionId);
    await refresh();
    if (cancelled) {
      addNotification(session.mentorId, "notif.requestCancelled", { name: menteeName }, sessionId);
    } else {
      addNotification(session.mentorId, "notif.moreSlotsRequested", { name: menteeName }, sessionId);
    }
    return session;
  };

  const cancelSession = async (sessionId, actorName) => {
    const session = await appointmentService.cancelAppointment(sessionId);
    await refresh();
    addNotification(session.mentorId, "notif.sessionCancelled", { name: actorName }, sessionId);
    addNotification(session.menteeId, "notif.sessionCancelled", { name: actorName }, sessionId);
    return session;
  };

  const markUnavailable = async (sessionId, role) => {
    const session = await appointmentService.markUnavailable(sessionId);
    await refresh();
    const target = role === "mentor" ? session.menteeId : session.mentorId;
    addNotification(target, "notif.rescheduleNeeded", {}, sessionId);
    return session;
  };

  const submitAttendance = async (sessionId, role, attended) => {
    const session = await appointmentService.submitAttendance(sessionId, role, attended);
    await refresh();
    return session;
  };

  const submitFeedback = async (sessionId, role, feedback) => {
    const session = await appointmentService.submitFeedback(sessionId, role, feedback);
    await refresh();
    return session;
  };

  const getSessionsForUser = (userId) =>
    sessions.filter((s) => s.mentorId === userId || s.menteeId === userId);

  const getCalendarEvents = async (userId, role) =>
    appointmentService.getCalendarEvents(userId, role);

  const getMentorAvailability = async (mentorId) =>
    appointmentService.getMentorAvailability(mentorId);

  const value = useMemo(
    () => ({
      sessions,
      loading,
      refresh,
      createRequest,
      approveRequest,
      rejectRequest,
      proposeSlots,
      selectSlot,
      requestMoreSlots,
      cancelSession,
      markUnavailable,
      submitAttendance,
      submitFeedback,
      getSessionsForUser,
      getCalendarEvents,
      getMentorAvailability,
      mapSchedulingToSessionStatus: appointmentService.mapSchedulingToSessionStatus,
    }),
    [sessions, loading, refresh]
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

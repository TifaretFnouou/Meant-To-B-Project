import React, { createContext, useContext, useMemo, useState } from "react";
import { mockSessions } from "../data/mockData";
import { SCHEDULING_STATE, SESSION_STATUS } from "../constants";
import { useNotifications } from "./NotificationContext";

const SchedulingContext = createContext(null);

function mapSchedulingToSessionStatus(state) {
  switch (state) {
    case SCHEDULING_STATE.PENDING_REQUEST:
      return SESSION_STATUS.PENDING;
    case SCHEDULING_STATE.SLOTS_PROPOSED:
    case SCHEDULING_STATE.ADDITIONAL_SLOTS_PROPOSED:
    case SCHEDULING_STATE.ADDITIONAL_SLOTS_REQUESTED:
      return SESSION_STATUS.SLOTS_PROPOSED;
    case SCHEDULING_STATE.MATCHED:
    case SCHEDULING_STATE.SLOT_SELECTED:
      return SESSION_STATUS.MATCHED;
    case SCHEDULING_STATE.CANCELLED:
    case SCHEDULING_STATE.REJECTED:
      return SESSION_STATUS.CANCELLED;
    case SCHEDULING_STATE.RESCHEDULE_REQUESTED:
      return SESSION_STATUS.RESCHEDULE;
    case SCHEDULING_STATE.COMPLETED:
      return SESSION_STATUS.COMPLETED;
    default:
      return SESSION_STATUS.PENDING;
  }
}

export function SchedulingProvider({ children }) {
  const [sessions, setSessions] = useState(mockSessions);
  const { addNotification } = useNotifications();

  const updateSession = (sessionId, updater) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? updater(s) : s))
    );
  };

  const createRequest = async (mentorId, menteeId, menteeName) => {
    const session = {
      id: `session-${Date.now()}`,
      mentorId,
      menteeId,
      status: SESSION_STATUS.PENDING,
      schedulingState: SCHEDULING_STATE.PENDING_REQUEST,
      proposedSlots: [],
      selectedSlot: null,
      matchedSlot: null,
      additionalSlotsUsed: false,
      rescheduleUsed: false,
      feedback: { mentor: null, mentee: null },
      attendance: { mentor: null, mentee: null },
      createdAt: new Date().toISOString(),
    };
    setSessions((prev) => [session, ...prev]);
    addNotification(mentorId, "notif.mentorshipRequest", { name: menteeName }, session.id);
    return session;
  };

  const approveRequest = async (sessionId, mentorName) => {
    updateSession(sessionId, (s) => ({
      ...s,
      schedulingState: SCHEDULING_STATE.SLOTS_PROPOSED,
      status: SESSION_STATUS.SLOTS_PROPOSED,
    }));
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      addNotification(session.menteeId, "notif.requestApproved", { name: mentorName }, sessionId);
    }
  };

  const rejectRequest = async (sessionId, mentorName) => {
    updateSession(sessionId, (s) => ({
      ...s,
      schedulingState: SCHEDULING_STATE.REJECTED,
      status: SESSION_STATUS.CANCELLED,
    }));
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      addNotification(session.menteeId, "notif.requestRejected", { name: mentorName }, sessionId);
    }
  };

  const proposeSlots = async (sessionId, slots, mentorName) => {
    updateSession(sessionId, (s) => ({
      ...s,
      proposedSlots: slots,
      schedulingState:
        s.schedulingState === SCHEDULING_STATE.ADDITIONAL_SLOTS_REQUESTED ||
        s.schedulingState === SCHEDULING_STATE.RESCHEDULE_REQUESTED
          ? SCHEDULING_STATE.ADDITIONAL_SLOTS_PROPOSED
          : SCHEDULING_STATE.SLOTS_PROPOSED,
      status: SESSION_STATUS.SLOTS_PROPOSED,
    }));
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      addNotification(session.menteeId, "notif.slotsProposed", { name: mentorName }, sessionId);
    }
  };

  const selectSlot = async (sessionId, slot, menteeName) => {
    updateSession(sessionId, (s) => ({
      ...s,
      selectedSlot: slot,
      matchedSlot: slot,
      schedulingState: SCHEDULING_STATE.MATCHED,
      status: SESSION_STATUS.MATCHED,
    }));
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      addNotification(session.mentorId, "notif.slotSelected", { name: menteeName }, sessionId);
    }
  };

  const requestMoreSlots = async (sessionId, menteeName) => {
    let cancelled = false;
    updateSession(sessionId, (s) => {
      if (s.additionalSlotsUsed) {
        cancelled = true;
        return {
          ...s,
          schedulingState: SCHEDULING_STATE.CANCELLED,
          status: SESSION_STATUS.CANCELLED,
        };
      }
      return {
        ...s,
        additionalSlotsUsed: true,
        schedulingState: SCHEDULING_STATE.ADDITIONAL_SLOTS_REQUESTED,
        status: SESSION_STATUS.SLOTS_PROPOSED,
      };
    });
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    if (cancelled) {
      addNotification(session.mentorId, "notif.requestCancelled", { name: menteeName }, sessionId);
    } else {
      addNotification(session.mentorId, "notif.moreSlotsRequested", { name: menteeName }, sessionId);
    }
  };

  const cancelSession = async (sessionId, actorName) => {
    updateSession(sessionId, (s) => ({
      ...s,
      schedulingState: SCHEDULING_STATE.CANCELLED,
      status: SESSION_STATUS.CANCELLED,
    }));
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      addNotification(session.mentorId, "notif.sessionCancelled", { name: actorName }, sessionId);
      addNotification(session.menteeId, "notif.sessionCancelled", { name: actorName }, sessionId);
    }
  };

  const markUnavailable = async (sessionId, role) => {
    updateSession(sessionId, (s) => {
      if (s.rescheduleUsed) {
        return {
          ...s,
          schedulingState: SCHEDULING_STATE.CANCELLED,
          status: SESSION_STATUS.CANCELLED,
        };
      }
      return {
        ...s,
        rescheduleUsed: true,
        schedulingState: SCHEDULING_STATE.RESCHEDULE_REQUESTED,
        status: SESSION_STATUS.RESCHEDULE,
        proposedSlots: [],
        selectedSlot: null,
        matchedSlot: null,
      };
    });
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      const target = role === "mentor" ? session.menteeId : session.mentorId;
      addNotification(target, "notif.rescheduleNeeded", {}, sessionId);
    }
  };

  const submitAttendance = async (sessionId, role, attended) => {
    updateSession(sessionId, (s) => {
      const attendance = { ...s.attendance, [role]: attended };
      const bothAnswered = attendance.mentor !== null && attendance.mentee !== null;
      const bothNo = attendance.mentor === false && attendance.mentee === false;
      let schedulingState = s.schedulingState;
      let status = s.status;
      if (bothAnswered && bothNo && !s.rescheduleUsed) {
        schedulingState = SCHEDULING_STATE.RESCHEDULE_REQUESTED;
        status = SESSION_STATUS.RESCHEDULE;
      } else if (bothAnswered) {
        schedulingState = SCHEDULING_STATE.COMPLETED;
        status = SESSION_STATUS.COMPLETED;
      }
      return { ...s, attendance, schedulingState, status };
    });
  };

  const submitFeedback = async (sessionId, role, feedback) => {
    updateSession(sessionId, (s) => ({
      ...s,
      feedback: { ...s.feedback, [role]: feedback },
    }));
  };

  const getSessionsForUser = (userId) =>
    sessions.filter((s) => s.mentorId === userId || s.menteeId === userId);

  const value = useMemo(
    () => ({
      sessions,
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
      mapSchedulingToSessionStatus,
    }),
    [sessions]
  );

  return (
    <SchedulingContext.Provider value={value}>
      {children}
    </SchedulingContext.Provider>
  );
}

export function useScheduling() {
  const ctx = useContext(SchedulingContext);
  if (!ctx) {
    throw new Error("useScheduling must be used within SchedulingProvider");
  }
  return ctx;
}

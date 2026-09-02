import { mockAppointments } from "../data/mockAppointments";
import { SCHEDULING_STATE, SESSION_STATUS } from "../constants";

/**
 * Appointment / scheduling service.
 * All methods are async and return Promises so they can later be swapped
 * for real HTTP calls (axios/fetch) without changing consumers.
 */

const STORAGE_KEY = "queenb_appointments_v1";

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(mockAppointments);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : structuredClone(mockAppointments);
  } catch {
    return structuredClone(mockAppointments);
  }
}

let store = loadStore();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore quota errors in demo */
  }
}

function delay(ms = 60) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

function findOrThrow(sessionId) {
  const session = store.find((s) => s.id === sessionId);
  if (!session) throw new Error(`Appointment ${sessionId} not found`);
  return session;
}

function patchSession(sessionId, updater) {
  store = store.map((s) => (s.id === sessionId ? updater(s) : s));
  persist();
  return store.find((s) => s.id === sessionId);
}

/** Normalize appointments into calendar events for dashboards */
export function toCalendarEvents(appointments, { userId, role } = {}) {
  const events = [];

  appointments.forEach((session) => {
    if (role === "mentor" && session.mentorId !== userId) return;
    if (role === "mentee" && session.menteeId !== userId) return;
    if (userId && role !== "mentor" && role !== "mentee") {
      if (session.mentorId !== userId && session.menteeId !== userId) return;
    }

    const duration = session.durationMinutes || 60;

    if (session.matchedSlot) {
      const start = new Date(session.matchedSlot);
      const end = new Date(start.getTime() + duration * 60000);
      events.push({
        id: `${session.id}-matched`,
        sessionId: session.id,
        type: session.schedulingState === SCHEDULING_STATE.COMPLETED ? "completed" : "matched",
        start: start.toISOString(),
        end: end.toISOString(),
        status: session.status,
        schedulingState: session.schedulingState,
        mentorId: session.mentorId,
        menteeId: session.menteeId,
        titleKey: "calendar.eventBooked",
      });
    } else if (
      (session.schedulingState === SCHEDULING_STATE.SLOTS_PROPOSED ||
        session.schedulingState === SCHEDULING_STATE.ADDITIONAL_SLOTS_PROPOSED) &&
      session.proposedSlots?.length
    ) {
      session.proposedSlots.forEach((slot, index) => {
        const start = new Date(slot);
        const end = new Date(start.getTime() + duration * 60000);
        events.push({
          id: `${session.id}-proposed-${index}`,
          sessionId: session.id,
          type: "proposed",
          start: start.toISOString(),
          end: end.toISOString(),
          status: session.status,
          schedulingState: session.schedulingState,
          mentorId: session.mentorId,
          menteeId: session.menteeId,
          titleKey: "calendar.eventProposed",
          slot,
        });
      });
    } else if (session.schedulingState === SCHEDULING_STATE.PENDING_REQUEST) {
      events.push({
        id: `${session.id}-pending`,
        sessionId: session.id,
        type: "pending",
        start: session.createdAt,
        end: session.createdAt,
        allDayHint: true,
        status: session.status,
        schedulingState: session.schedulingState,
        mentorId: session.mentorId,
        menteeId: session.menteeId,
        titleKey: "calendar.eventPending",
      });
    }
  });

  return events.sort((a, b) => new Date(a.start) - new Date(b.start));
}

export const appointmentService = {
  mapSchedulingToSessionStatus,

  async getAppointments() {
    await delay();
    return structuredClone(store);
  },

  async getAppointmentsForUser(userId) {
    await delay();
    return structuredClone(
      store.filter((s) => s.mentorId === userId || s.menteeId === userId)
    );
  },

  async getAppointmentById(sessionId) {
    await delay();
    return structuredClone(findOrThrow(sessionId));
  },

  /** Busy / proposed slots for a mentor (for calendar conflict hints) */
  async getMentorAvailability(mentorId) {
    await delay();
    const mentorSessions = store.filter((s) => s.mentorId === mentorId);
    const busy = [];
    const proposed = [];

    mentorSessions.forEach((s) => {
      if (s.matchedSlot && ![SESSION_STATUS.CANCELLED, SESSION_STATUS.COMPLETED].includes(s.status)) {
        busy.push({
          sessionId: s.id,
          start: s.matchedSlot,
          durationMinutes: s.durationMinutes || 60,
        });
      }
      if (s.proposedSlots?.length && !s.matchedSlot) {
        s.proposedSlots.forEach((slot) => {
          proposed.push({ sessionId: s.id, start: slot, durationMinutes: s.durationMinutes || 60 });
        });
      }
    });

    return { busy, proposed, sessions: structuredClone(mentorSessions) };
  },

  async getCalendarEvents(userId, role) {
    await delay();
    return toCalendarEvents(store, { userId, role });
  },

  async createMentorshipRequest({ mentorId, menteeId, durationMinutes = 60 }) {
    await delay();
    const session = {
      id: `session-${Date.now()}`,
      mentorId,
      menteeId,
      status: SESSION_STATUS.PENDING,
      schedulingState: SCHEDULING_STATE.PENDING_REQUEST,
      proposedSlots: [],
      selectedSlot: null,
      matchedSlot: null,
      durationMinutes,
      additionalSlotsUsed: false,
      rescheduleUsed: false,
      feedback: { mentor: null, mentee: null },
      attendance: { mentor: null, mentee: null },
      createdAt: new Date().toISOString(),
    };
    store = [session, ...store];
    persist();
    return structuredClone(session);
  },

  async approveRequest(sessionId) {
    await delay();
    return structuredClone(
      patchSession(sessionId, (s) => ({
        ...s,
        schedulingState: SCHEDULING_STATE.SLOTS_PROPOSED,
        status: SESSION_STATUS.SLOTS_PROPOSED,
      }))
    );
  },

  async rejectRequest(sessionId) {
    await delay();
    return structuredClone(
      patchSession(sessionId, (s) => ({
        ...s,
        schedulingState: SCHEDULING_STATE.REJECTED,
        status: SESSION_STATUS.CANCELLED,
      }))
    );
  },

  async proposeSlots(sessionId, slots) {
    await delay();
    return structuredClone(
      patchSession(sessionId, (s) => ({
        ...s,
        proposedSlots: slots,
        schedulingState:
          s.schedulingState === SCHEDULING_STATE.ADDITIONAL_SLOTS_REQUESTED ||
          s.schedulingState === SCHEDULING_STATE.RESCHEDULE_REQUESTED
            ? SCHEDULING_STATE.ADDITIONAL_SLOTS_PROPOSED
            : SCHEDULING_STATE.SLOTS_PROPOSED,
        status: SESSION_STATUS.SLOTS_PROPOSED,
      }))
    );
  },

  /** Mentee finalizes a preferred slot */
  async bookSlot(sessionId, slotIso) {
    await delay();
    return structuredClone(
      patchSession(sessionId, (s) => ({
        ...s,
        selectedSlot: slotIso,
        matchedSlot: slotIso,
        schedulingState: SCHEDULING_STATE.MATCHED,
        status: SESSION_STATUS.MATCHED,
      }))
    );
  },

  async requestMoreSlots(sessionId) {
    await delay();
    let cancelled = false;
    const updated = patchSession(sessionId, (s) => {
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
        proposedSlots: [],
      };
    });
    return { session: structuredClone(updated), cancelled };
  },

  async cancelAppointment(sessionId) {
    await delay();
    return structuredClone(
      patchSession(sessionId, (s) => ({
        ...s,
        schedulingState: SCHEDULING_STATE.CANCELLED,
        status: SESSION_STATUS.CANCELLED,
      }))
    );
  },

  async markUnavailable(sessionId) {
    await delay();
    return structuredClone(
      patchSession(sessionId, (s) => {
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
      })
    );
  },

  async submitAttendance(sessionId, role, attended) {
    await delay();
    return structuredClone(
      patchSession(sessionId, (s) => {
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
      })
    );
  },

  async submitFeedback(sessionId, role, feedback) {
    await delay();
    return structuredClone(
      patchSession(sessionId, (s) => ({
        ...s,
        feedback: { ...s.feedback, [role]: feedback },
      }))
    );
  },

  /** Demo helper — reset store to seed data */
  async resetMockData() {
    await delay();
    store = structuredClone(mockAppointments);
    persist();
    return structuredClone(store);
  },
};

export default appointmentService;

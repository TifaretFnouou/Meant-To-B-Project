import { SCHEDULING_STATE, SESSION_STATUS } from "../constants";

/**
 * Seed appointments for the calendar / scheduling flow.
 * Dates are relative to a fixed demo "now" around Sep 2026 so the UI stays useful.
 */
function isoAt(dayOffset, hour, minute = 0) {
  const base = new Date("2026-09-02T00:00:00");
  base.setDate(base.getDate() + dayOffset);
  base.setHours(hour, minute, 0, 0);
  return base.toISOString();
}

export const mockAppointments = [
  {
    id: "session-1",
    mentorId: "mentor-1",
    menteeId: "mentee-1",
    status: SESSION_STATUS.SLOTS_PROPOSED,
    schedulingState: SCHEDULING_STATE.SLOTS_PROPOSED,
    proposedSlots: [isoAt(3, 10), isoAt(3, 14), isoAt(4, 11)],
    selectedSlot: null,
    matchedSlot: null,
    durationMinutes: 60,
    additionalSlotsUsed: false,
    rescheduleUsed: false,
    feedback: { mentor: null, mentee: null },
    attendance: { mentor: null, mentee: null },
    createdAt: isoAt(-1, 8),
  },
  {
    id: "session-2",
    mentorId: "mentor-1",
    menteeId: "dual-1",
    status: SESSION_STATUS.MATCHED,
    schedulingState: SCHEDULING_STATE.MATCHED,
    proposedSlots: [isoAt(2, 16)],
    selectedSlot: isoAt(2, 16),
    matchedSlot: isoAt(2, 16),
    durationMinutes: 60,
    additionalSlotsUsed: false,
    rescheduleUsed: false,
    feedback: { mentor: null, mentee: null },
    attendance: { mentor: null, mentee: null },
    createdAt: isoAt(-3, 10),
  },
  {
    id: "session-3",
    mentorId: "dual-1",
    menteeId: "mentee-1",
    status: SESSION_STATUS.PENDING,
    schedulingState: SCHEDULING_STATE.PENDING_REQUEST,
    proposedSlots: [],
    selectedSlot: null,
    matchedSlot: null,
    durationMinutes: 60,
    additionalSlotsUsed: false,
    rescheduleUsed: false,
    feedback: { mentor: null, mentee: null },
    attendance: { mentor: null, mentee: null },
    createdAt: isoAt(0, 9),
  },
  {
    id: "session-4",
    mentorId: "mentor-2",
    menteeId: "mentee-1",
    status: SESSION_STATUS.MATCHED,
    schedulingState: SCHEDULING_STATE.MATCHED,
    proposedSlots: [isoAt(5, 13)],
    selectedSlot: isoAt(5, 13),
    matchedSlot: isoAt(5, 13),
    durationMinutes: 90,
    additionalSlotsUsed: false,
    rescheduleUsed: false,
    feedback: { mentor: null, mentee: null },
    attendance: { mentor: null, mentee: null },
    createdAt: isoAt(-2, 12),
  },
];

/** @deprecated Use mockAppointments — kept for Compatibility with older imports */
export const mockSessions = mockAppointments;

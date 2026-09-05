// // import { mockAppointments } from "../data/mockAppointments";
// // import { SCHEDULING_STATE, MEETING_STATUS } from "../constants";

// // /**
// //  * Appointment / scheduling service.
// //  * All methods are async and return Promises so they can later be swapped
// //  * for real HTTP calls (axios/fetch) without changing consumers.
// //  */

// // const STORAGE_KEY = "queenb_appointments_v1";

// // function loadStore() {
// //   try {
// //     const raw = localStorage.getItem(STORAGE_KEY);
// //     if (!raw) return structuredClone(mockAppointments);
// //     const parsed = JSON.parse(raw);
// //     return Array.isArray(parsed) && parsed.length ? parsed : structuredClone(mockAppointments);
// //   } catch {
// //     return structuredClone(mockAppointments);
// //   }
// // }

// // let store = loadStore();

// // function persist() {
// //   try {
// //     localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
// //   } catch {
// //     /* ignore quota errors in demo */
// //   }
// // }

// // function delay(ms = 60) {
// //   return new Promise((resolve) => setTimeout(resolve, ms));
// // }

// // function mapSchedulingToMeetingstatus(state) {
// //   switch (state) {
// //     case SCHEDULING_STATE.PENDING_REQUEST:
// //       return MEETING_STATUS.PENDING;
// //     case SCHEDULING_STATE.SLOTS_PROPOSED:
// //     case SCHEDULING_STATE.ADDITIONAL_SLOTS_PROPOSED:
// //     case SCHEDULING_STATE.ADDITIONAL_SLOTS_REQUESTED:
// //       return MEETING_STATUS.SLOTS_PROPOSED;
// //     case SCHEDULING_STATE.MATCHED:
// //     case SCHEDULING_STATE.SLOT_SELECTED:
// //       return MEETING_STATUS.MATCHED;
// //     case SCHEDULING_STATE.CANCELLED:
// //     case SCHEDULING_STATE.REJECTED:
// //       return MEETING_STATUS.CANCELLED;
// //     case SCHEDULING_STATE.RESCHEDULE_REQUESTED:
// //       return MEETING_STATUS.RESCHEDULE;
// //     case SCHEDULING_STATE.COMPLETED:
// //       return MEETING_STATUS.COMPLETED;
// //     default:
// //       return MEETING_STATUS.PENDING;
// //   }
// // }

// // function findOrThrow(meetingId) {
// //   const meeting = store.find((s) => s.id === meetingId);
// //   if (!meeting) throw new Error(`Appointment ${meetingId} not found`);
// //   return meeting;
// // }

// // function patchMeeting(meetingId, updater) {
// //   store = store.map((s) => (s.id === meetingId ? updater(s) : s));
// //   persist();
// //   return store.find((s) => s.id === meetingId);
// // }

// // /** Normalize appointments into calendar events for dashboards */
// // export function toCalendarEvents(appointments, { userId, role } = {}) {
// //   const events = [];

// //   appointments.forEach((meeting) => {
// //     if (role === "mentor" && meeting.mentorId !== userId) return;
// //     if (role === "mentee" && meeting.menteeId !== userId) return;
// //     if (userId && role !== "mentor" && role !== "mentee") {
// //       if (meeting.mentorId !== userId && meeting.menteeId !== userId) return;
// //     }

// //     const duration = meeting.durationMinutes || 60;

// //     if (meeting.matchedSlot) {
// //       const start = new Date(meeting.matchedSlot);
// //       const end = new Date(start.getTime() + duration * 60000);
// //       events.push({
// //         id: `${meeting.id}-matched`,
// //         meetingId: meeting.id,
// //         type: meeting.schedulingState === SCHEDULING_STATE.COMPLETED ? "completed" : "matched",
// //         start: start.toISOString(),
// //         end: end.toISOString(),
// //         status: meeting.status,
// //         schedulingState: meeting.schedulingState,
// //         mentorId: meeting.mentorId,
// //         menteeId: meeting.menteeId,
// //         titleKey: "calendar.eventBooked",
// //       });
// //     } else if (
// //       (meeting.schedulingState === SCHEDULING_STATE.SLOTS_PROPOSED ||
// //         meeting.schedulingState === SCHEDULING_STATE.ADDITIONAL_SLOTS_PROPOSED) &&
// //       meeting.proposedSlots?.length
// //     ) {
// //       meeting.proposedSlots.forEach((slot, index) => {
// //         const start = new Date(slot);
// //         const end = new Date(start.getTime() + duration * 60000);
// //         events.push({
// //           id: `${meeting.id}-proposed-${index}`,
// //           meetingId: meeting.id,
// //           type: "proposed",
// //           start: start.toISOString(),
// //           end: end.toISOString(),
// //           status: meeting.status,
// //           schedulingState: meeting.schedulingState,
// //           mentorId: meeting.mentorId,
// //           menteeId: meeting.menteeId,
// //           titleKey: "calendar.eventProposed",
// //           slot,
// //         });
// //       });
// //     } else if (meeting.schedulingState === SCHEDULING_STATE.PENDING_REQUEST) {
// //       events.push({
// //         id: `${meeting.id}-pending`,
// //         meetingId: meeting.id,
// //         type: "pending",
// //         start: meeting.createdAt,
// //         end: meeting.createdAt,
// //         allDayHint: true,
// //         status: meeting.status,
// //         schedulingState: meeting.schedulingState,
// //         mentorId: meeting.mentorId,
// //         menteeId: meeting.menteeId,
// //         titleKey: "calendar.eventPending",
// //       });
// //     }
// //   });

// //   return events.sort((a, b) => new Date(a.start) - new Date(b.start));
// // }

// // export const appointmentService = {
// //   mapSchedulingToMeetingstatus,

// //   async getAppointments() {
// //     await delay();
// //     return structuredClone(store);
// //   },

// //   async getAppointmentsForUser(userId) {
// //     await delay();
// //     return structuredClone(
// //       store.filter((s) => s.mentorId === userId || s.menteeId === userId)
// //     );
// //   },

// //   async getAppointmentById(meetingId) {
// //     await delay();
// //     return structuredClone(findOrThrow(meetingId));
// //   },

// //   /** Busy / proposed slots for a mentor (for calendar conflict hints) */
// //   async getMentorAvailability(mentorId) {
// //     await delay();
// //     const mentorMeetings = store.filter((s) => s.mentorId === mentorId);
// //     const busy = [];
// //     const proposed = [];

// //     mentorMeetings.forEach((s) => {
// //       if (s.matchedSlot && ![MEETING_STATUS.CANCELLED, MEETING_STATUS.COMPLETED].includes(s.status)) {
// //         busy.push({
// //           meetingId: s.id,
// //           start: s.matchedSlot,
// //           durationMinutes: s.durationMinutes || 60,
// //         });
// //       }
// //       if (s.proposedSlots?.length && !s.matchedSlot) {
// //         s.proposedSlots.forEach((slot) => {
// //           proposed.push({ meetingId: s.id, start: slot, durationMinutes: s.durationMinutes || 60 });
// //         });
// //       }
// //     });

// //     return { busy, proposed, Meetings: structuredClone(mentorMeetings) };
// //   },

// //   async getCalendarEvents(userId, role) {
// //     await delay();
// //     return toCalendarEvents(store, { userId, role });
// //   },

// //   async createMentorshipRequest({ mentorId, menteeId, durationMinutes = 60 }) {
// //     await delay();
// //     const meeting = {
// //       id: `meeting-${Date.now()}`,
// //       mentorId,
// //       menteeId,
// //       status: MEETING_STATUS.PENDING,
// //       schedulingState: SCHEDULING_STATE.PENDING_REQUEST,
// //       proposedSlots: [],
// //       selectedSlot: null,
// //       matchedSlot: null,
// //       durationMinutes,
// //       additionalSlotsUsed: false,
// //       rescheduleUsed: false,
// //       feedback: { mentor: null, mentee: null },
// //       attendance: { mentor: null, mentee: null },
// //       createdAt: new Date().toISOString(),
// //     };
// //     store = [meeting, ...store];
// //     persist();
// //     return structuredClone(meeting);
// //   },

// //   async approveRequest(meetingId) {
// //     await delay();
// //     return structuredClone(
// //       patchMeeting(meetingId, (s) => ({
// //         ...s,
// //         schedulingState: SCHEDULING_STATE.SLOTS_PROPOSED,
// //         status: MEETING_STATUS.SLOTS_PROPOSED,
// //       }))
// //     );
// //   },

// //   async rejectRequest(meetingId) {
// //     await delay();
// //     return structuredClone(
// //       patchMeeting(meetingId, (s) => ({
// //         ...s,
// //         schedulingState: SCHEDULING_STATE.REJECTED,
// //         status: MEETING_STATUS.CANCELLED,
// //       }))
// //     );
// //   },

// //   async proposeSlots(meetingId, slots) {
// //     await delay();
// //     return structuredClone(
// //       patchMeeting(meetingId, (s) => ({
// //         ...s,
// //         proposedSlots: slots,
// //         schedulingState:
// //           s.schedulingState === SCHEDULING_STATE.ADDITIONAL_SLOTS_REQUESTED ||
// //           s.schedulingState === SCHEDULING_STATE.RESCHEDULE_REQUESTED
// //             ? SCHEDULING_STATE.ADDITIONAL_SLOTS_PROPOSED
// //             : SCHEDULING_STATE.SLOTS_PROPOSED,
// //         status: MEETING_STATUS.SLOTS_PROPOSED,
// //       }))
// //     );
// //   },

// //   /** Mentee finalizes a preferred slot */
// //   async bookSlot(meetingId, slotIso) {
// //     await delay();
// //     return structuredClone(
// //       patchMeeting(meetingId, (s) => ({
// //         ...s,
// //         selectedSlot: slotIso,
// //         matchedSlot: slotIso,
// //         schedulingState: SCHEDULING_STATE.MATCHED,
// //         status: MEETING_STATUS.MATCHED,
// //       }))
// //     );
// //   },

// //   async requestMoreSlots(meetingId) {
// //     await delay();
// //     let cancelled = false;
// //     const updated = patchMeeting(meetingId, (s) => {
// //       if (s.additionalSlotsUsed) {
// //         cancelled = true;
// //         return {
// //           ...s,
// //           schedulingState: SCHEDULING_STATE.CANCELLED,
// //           status: MEETING_STATUS.CANCELLED,
// //         };
// //       }
// //       return {
// //         ...s,
// //         additionalSlotsUsed: true,
// //         schedulingState: SCHEDULING_STATE.ADDITIONAL_SLOTS_REQUESTED,
// //         status: MEETING_STATUS.SLOTS_PROPOSED,
// //         proposedSlots: [],
// //       };
// //     });
// //     return { meeting: structuredClone(updated), cancelled };
// //   },

// //   async cancelAppointment(meetingId) {
// //     await delay();
// //     return structuredClone(
// //       patchMeeting(meetingId, (s) => ({
// //         ...s,
// //         schedulingState: SCHEDULING_STATE.CANCELLED,
// //         status: MEETING_STATUS.CANCELLED,
// //       }))
// //     );
// //   },

// //   async markUnavailable(meetingId) {
// //     await delay();
// //     return structuredClone(
// //       patchMeeting(meetingId, (s) => {
// //         if (s.rescheduleUsed) {
// //           return {
// //             ...s,
// //             schedulingState: SCHEDULING_STATE.CANCELLED,
// //             status: MEETING_STATUS.CANCELLED,
// //           };
// //         }
// //         return {
// //           ...s,
// //           rescheduleUsed: true,
// //           schedulingState: SCHEDULING_STATE.RESCHEDULE_REQUESTED,
// //           status: MEETING_STATUS.RESCHEDULE,
// //           proposedSlots: [],
// //           selectedSlot: null,
// //           matchedSlot: null,
// //         };
// //       })
// //     );
// //   },

// //   async submitAttendance(meetingId, role, attended) {
// //     await delay();
// //     return structuredClone(
// //       patchMeeting(meetingId, (s) => {
// //         const attendance = { ...s.attendance, [role]: attended };
// //         const bothAnswered = attendance.mentor !== null && attendance.mentee !== null;
// //         const bothNo = attendance.mentor === false && attendance.mentee === false;
// //         let schedulingState = s.schedulingState;
// //         let status = s.status;
// //         if (bothAnswered && bothNo && !s.rescheduleUsed) {
// //           schedulingState = SCHEDULING_STATE.RESCHEDULE_REQUESTED;
// //           status = MEETING_STATUS.RESCHEDULE;
// //         } else if (bothAnswered) {
// //           schedulingState = SCHEDULING_STATE.COMPLETED;
// //           status = MEETING_STATUS.COMPLETED;
// //         }
// //         return { ...s, attendance, schedulingState, status };
// //       })
// //     );
// //   },

// //   async submitFeedback(meetingId, role, feedback) {
// //     await delay();
// //     return structuredClone(
// //       patchMeeting(meetingId, (s) => ({
// //         ...s,
// //         feedback: { ...s.feedback, [role]: feedback },
// //       }))
// //     );
// //   },

// //   /** Demo helper - reset store to seed data */
// //   async resetMockData() {
// //     await delay();
// //     store = structuredClone(mockAppointments);
// //     persist();
// //     return structuredClone(store);
// //   },
// // };

// // export default appointmentService;

// import api from "./api";
// import { SCHEDULING_STATE, MEETING_STATUS } from "../constants";

// function mapMeetingToFrontend(meeting) {
//   let schedulingState = SCHEDULING_STATE.PENDING_REQUEST;
//   let status = MEETING_STATUS.PENDING;

//   switch (meeting.status) {
//     case "PENDING_MENTOR_TIMES":
//       schedulingState = SCHEDULING_STATE.PENDING_REQUEST;
//       status = MEETING_STATUS.PENDING;
//       break;
//     case "PENDING_MENTEE_SELECTION":
//       schedulingState = SCHEDULING_STATE.SLOTS_PROPOSED;
//       status = MEETING_STATUS.SLOTS_PROPOSED;
//       break;
//     case "MATCHED":
//       schedulingState = SCHEDULING_STATE.MATCHED;
//       status = MEETING_STATUS.MATCHED;
//       break;
//     case "CANCELLED":
//       schedulingState = SCHEDULING_STATE.CANCELLED;
//       status = MEETING_STATUS.CANCELLED;
//       break;
//     case "COMPLETED":
//       schedulingState = SCHEDULING_STATE.COMPLETED;
//       status = MEETING_STATUS.COMPLETED;
//       break;
//   }

//   return {
//     id: meeting._id || meeting.id,
//     mentorId: typeof meeting.mentorId === "object" ? meeting.mentorId._id : meeting.mentorId,
//     menteeId: typeof meeting.menteeId === "object" ? meeting.menteeId._id : meeting.menteeId,
//     mentorDetails: typeof meeting.mentorId === "object" ? meeting.mentorId : null,
//     menteeDetails: typeof meeting.menteeId === "object" ? meeting.menteeId : null,
//     status,
//     schedulingState,
//     proposedSlots: meeting.proposedTimes?.map((pt) => pt.startTime) || [],
//     matchedSlot: meeting.scheduledTime?.startTime || null,
//     durationMinutes: 45,
//     rescheduleUsed: meeting.rescheduleCount > 0,
//     createdAt: meeting.createdAt,
//   };
// }

// export function toCalendarEvents(appointments, { userId, role } = {}) {
//   const events = [];

//   appointments.forEach((meeting) => {
//     if (role === "mentor" && meeting.mentorId !== userId) return;
//     if (role === "mentee" && meeting.menteeId !== userId) return;
//     if (userId && role !== "mentor" && role !== "mentee") {
//       if (meeting.mentorId !== userId && meeting.menteeId !== userId) return;
//     }

//     const duration = meeting.durationMinutes || 45;

//     if (meeting.matchedSlot) {
//       const start = new Date(meeting.matchedSlot);
//       const end = new Date(start.getTime() + duration * 60000);
//       events.push({
//         id: `${meeting.id}-matched`,
//         meetingId: meeting.id,
//         type: meeting.schedulingState === SCHEDULING_STATE.COMPLETED ? "completed" : "matched",
//         start: start.toISOString(),
//         end: end.toISOString(),
//         status: meeting.status,
//         schedulingState: meeting.schedulingState,
//         mentorId: meeting.mentorId,
//         menteeId: meeting.menteeId,
//         titleKey: "calendar.eventBooked",
//       });
//     } else if (
//       (meeting.schedulingState === SCHEDULING_STATE.SLOTS_PROPOSED ||
//         meeting.schedulingState === SCHEDULING_STATE.ADDITIONAL_SLOTS_PROPOSED) &&
//       meeting.proposedSlots?.length
//     ) {
//       meeting.proposedSlots.forEach((slot, index) => {
//         const start = new Date(slot);
//         const end = new Date(start.getTime() + duration * 60000);
//         events.push({
//           id: `${meeting.id}-proposed-${index}`,
//           meetingId: meeting.id,
//           type: "proposed",
//           start: start.toISOString(),
//           end: end.toISOString(),
//           status: meeting.status,
//           schedulingState: meeting.schedulingState,
//           mentorId: meeting.mentorId,
//           menteeId: meeting.menteeId,
//           titleKey: "calendar.eventProposed",
//           slot,
//         });
//       });
//     }
//   });

//   return events.sort((a, b) => new Date(a.start) - new Date(b.start));
// }

// export const appointmentService = {
//   async getAppointmentsForUser() {
//     const response = await api.get("meetings/my-Meetings");
//     return response.data.data.map(mapMeetingToFrontend);
//   },

//   async getCalendarEvents(userId, role) {
//     const Meetings = await this.getAppointmentsForUser();
//     return toCalendarEvents(Meetings, { userId, role });
//   },

//   async createMentorshipRequest({ mentorId }) {
//     const response = await api.post("meetings/", { mentorId: mentorId });
//     return mapMeetingToFrontend(response.data.meeting);
//   },

//   async rejectRequest(meetingId) {
//     const response = await api.put(`meetings/${meetingId}/reject`);
//     return mapMeetingToFrontend(response.data.meeting);
//   },

//   async cancelAppointment(meetingId) {
//     return this.rejectRequest(meetingId);
//   },

//   async proposeSlots(meetingId, slots, durationMinutes = 45) {
//     const proposedTimes = slots.map((slotIso) => {
//       const start = new Date(slotIso);
//       const end = new Date(start.getTime() + durationMinutes * 60000);
//       return { startTime: start, endTime: end };
//     });

//     const response = await api.put(`/${meetingId}/propose-times`, { proposedTimes });
//     return mapMeetingToFrontend(response.data.meeting);
//   },

//   async bookSlot(meetingId, slotIso, durationMinutes = 45) {
//     const start = new Date(slotIso);
//     const end = new Date(start.getTime() + durationMinutes * 60000);
//     const selectedTime = { startTime: start, endTime: end };

//     const response = await api.put(`/${meetingId}/select-time`, { selectedTime });
//     return mapMeetingToFrontend(response.data.meeting);
//   },

//   async requestMoreSlots(meetingId) {
//     console.warn("Backend route for requesting more slots is missing!");
//     return { cancelled: true };
//   },

//   async submitAttendance(meetingId, role, attended) {
//     console.warn("Backend route for attendance is missing!");
//     return null;
//   },

//   async submitFeedback(meetingId, role, feedback) {
//     console.warn("Backend route for feedback is missing!");
//     return null;
//   }
// };

// export default appointmentService;

import api from "./api";
import { SCHEDULING_STATE, MEETING_STATUS } from "../constants";

function mapMeetingToFrontend(meeting) {
  let schedulingState = SCHEDULING_STATE.PENDING_REQUEST;
  let status = MEETING_STATUS.PENDING;

  switch (meeting.status) {
    case "PENDING_MENTOR_TIMES":
      schedulingState = SCHEDULING_STATE.PENDING_REQUEST;
      status = MEETING_STATUS.PENDING;
      break;
    case "PENDING_MENTEE_SELECTION":
      schedulingState = SCHEDULING_STATE.SLOTS_PROPOSED;
      status = MEETING_STATUS.SLOTS_PROPOSED;
      break;
    case "MATCHED":
      schedulingState = SCHEDULING_STATE.MATCHED;
      status = MEETING_STATUS.MATCHED;
      break;
    case "CANCELLED":
      schedulingState = SCHEDULING_STATE.CANCELLED;
      status = MEETING_STATUS.CANCELLED;
      break;
    case "COMPLETED":
      schedulingState = SCHEDULING_STATE.COMPLETED;
      status = MEETING_STATUS.COMPLETED;
      break;
  }

  return {
    id: meeting._id || meeting.id,
    mentorId: typeof meeting.mentorId === "object" ? meeting.mentorId._id : meeting.mentorId,
    menteeId: typeof meeting.menteeId === "object" ? meeting.menteeId._id : meeting.menteeId,
    mentorDetails: typeof meeting.mentorId === "object" ? meeting.mentorId : null,
    menteeDetails: typeof meeting.menteeId === "object" ? meeting.menteeId : null,
    status,
    schedulingState,
    proposedSlots: meeting.proposedTimes?.map((pt) => pt.startTime) || [],
    matchedSlot: meeting.scheduledTime?.startTime || null,
    durationMinutes: 45,
    rescheduleUsed: meeting.rescheduleCount > 0,
    createdAt: meeting.createdAt,
  };
}

export function toCalendarEvents(appointments, { userId, role } = {}) {
  const events = [];

  appointments.forEach((meeting) => {
    if (role === "mentor" && meeting.mentorId !== userId) return;
    if (role === "mentee" && meeting.menteeId !== userId) return;
    if (userId && role !== "mentor" && role !== "mentee") {
      if (meeting.mentorId !== userId && meeting.menteeId !== userId) return;
    }

    const duration = meeting.durationMinutes || 45;

    if (meeting.matchedSlot) {
      const start = new Date(meeting.matchedSlot);
      const end = new Date(start.getTime() + duration * 60000);
      events.push({
        id: `${meeting.id}-matched`,
        meetingId: meeting.id,
        type: meeting.schedulingState === SCHEDULING_STATE.COMPLETED ? "completed" : "matched",
        start: start.toISOString(),
        end: end.toISOString(),
        status: meeting.status,
        schedulingState: meeting.schedulingState,
        mentorId: meeting.mentorId,
        menteeId: meeting.menteeId,
        titleKey: "calendar.eventBooked",
      });
    } else if (
      (meeting.schedulingState === SCHEDULING_STATE.SLOTS_PROPOSED ||
        meeting.schedulingState === SCHEDULING_STATE.ADDITIONAL_SLOTS_PROPOSED) &&
      meeting.proposedSlots?.length
    ) {
      meeting.proposedSlots.forEach((slot, index) => {
        const start = new Date(slot);
        const end = new Date(start.getTime() + duration * 60000);
        events.push({
          id: `${meeting.id}-proposed-${index}`,
          meetingId: meeting.id,
          type: "proposed",
          start: start.toISOString(),
          end: end.toISOString(),
          status: meeting.status,
          schedulingState: meeting.schedulingState,
          mentorId: meeting.mentorId,
          menteeId: meeting.menteeId,
          titleKey: "calendar.eventProposed",
          slot,
        });
      });
    }
  });

  return events.sort((a, b) => new Date(a.start) - new Date(b.start));
}

export const appointmentService = {
  async getAppointmentsForUser() {
    const response = await api.get("/meetings/my-meetings");
    return response.data.data.map(mapMeetingToFrontend);
  },

  async getCalendarEvents(userId, role) {
    const Meetings = await this.getAppointmentsForUser();
    return toCalendarEvents(Meetings, { userId, role });
  },

  async createMentorshipRequest({ mentorId }) {
    const response = await api.post("/meetings", { mentorId });
    return mapMeetingToFrontend(response.data.meeting);
  },

  async rejectRequest(meetingId) {
    const response = await api.put(`/meetings/${meetingId}/reject`);
    return mapMeetingToFrontend(response.data.meeting);
  },

  async cancelAppointment(meetingId) {
    return this.rejectRequest(meetingId);
  },

  async proposeSlots(meetingId, slots, durationMinutes = 45) {
    const proposedTimes = slots.map((slotIso) => {
      const start = new Date(slotIso);
      const end = new Date(start.getTime() + durationMinutes * 60000);
      return { startTime: start, endTime: end };
    });

    const response = await api.put(`/meetings/${meetingId}/propose-times`, { proposedTimes });
    return mapMeetingToFrontend(response.data.meeting);
  },

  async bookSlot(meetingId, slotIso, durationMinutes = 45) {
    const start = new Date(slotIso);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    
      // send the time in the exact format the server expects
    const selectedTime = { 
      startTime: start.toISOString(), 
      endTime: end.toISOString() 
    };

    const response = await api.put(`/meetings/${meetingId}/select-time`, { selectedTime });
    return mapMeetingToFrontend(response.data.meeting);
  },

  async requestMoreSlots(meetingId) {
    console.warn("Backend route for requesting more slots is missing!");
    return { cancelled: true };
  },

  async submitAttendance(meetingId, role, attended) {
    console.warn("Backend route for attendance is missing!");
    return null;
  },

  async submitFeedback(meetingId, role, feedback) {
    console.warn("Backend route for feedback is missing!");
    return null;
  },

  async markUnavailable(meetingId, userId) {
    const response = await api.put(`/meetings/${meetingId}/mark-unavailable`, { userId });
    return mapMeetingToFrontend(response.data.meeting);
  },
};  

export default appointmentService;
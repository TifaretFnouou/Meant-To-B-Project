import api from "./api";

function mapSlots(slots = []) {
  return slots
    .filter((s) => s?.startTime)
    .map((s) => ({
      startTime: new Date(s.startTime).toISOString(),
      endTime: s.endTime
        ? new Date(s.endTime).toISOString()
        : new Date(new Date(s.startTime).getTime() + 60 * 60000).toISOString(),
    }));
}

export const availabilityService = {
  async getMyAvailability() {
    const response = await api.get("/availability/me");
    const data = response.data?.data || {};
    return {
      mentorId: data.mentorId ? String(data.mentorId) : null,
      slots: mapSlots(data.slots),
    };
  },

  async setWeekAvailability({ weekStart, weekEnd, slots }) {
    const response = await api.put("/availability/me", {
      weekStart,
      weekEnd,
      slots,
    });
    const data = response.data?.data || {};
    return {
      mentorId: data.mentorId ? String(data.mentorId) : null,
      slots: mapSlots(data.slots),
    };
  },

  async getMentorOpenSlots(mentorId) {
    const response = await api.get(`/availability/mentor/${mentorId}`);
    const data = response.data?.data || {};
    return {
      mentorId: data.mentorId ? String(data.mentorId) : String(mentorId),
      meetingLengthMinutes: data.meetingLengthMinutes || 60,
      slots: mapSlots(data.slots),
    };
  },

  async requestMoreAvailability(mentorId, message = "") {
    const response = await api.post(`/availability/mentor/${mentorId}/request`, {
      message,
    });
    return response.data?.data || { ok: true };
  },
};

export default availabilityService;

import api from "./api";

export const meetingChatService = {
  // Get messages for a specific meeting
  async getMessages(meetingId) {
    const response = await api.get(`/meetings/${meetingId}/messages`);
    return response.data.messages || [];
  },

  // Send a new message to a specific meeting
  async sendMessage(meetingId, text) {
    const response = await api.post(`/meetings/${meetingId}/messages`, { text });
    return response.data.message;
  },
};
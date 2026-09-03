import axios from "axios";

const CHAT_ENDPOINT = "/api/chat";

export async function sendChatMessage(message) {
  const response = await axios.post(CHAT_ENDPOINT, { message });
  return response.data;
}

export default {
  sendChatMessage,
};

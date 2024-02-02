import { SignalingMessage } from "@/types/signaling";

export const sendMessage = async (message: SignalingMessage) => {
  return fetch('/api/signaling', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
  })
}
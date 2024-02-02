export type SignalingMessage = {
    user: string,
    roomCode: string,
    type: SignalingMessageType,
    candidate?: RTCIceCandidateInit | null,
    sdp?: RTCSessionDescriptionInit | null,
    establisherContent?: EstablishingMessageType | null,
}

export enum SignalingMessageType {
    iceCandidate = 'new-ice-candidate',
    offer = 'offer',
    answer = 'answer',
    establisher = 'connection-establisher'
}

export enum EstablishingMessageType {
  ping = 'ping',
  pong = 'pong'
}
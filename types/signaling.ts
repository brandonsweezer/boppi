export type SignalingMessage = {
    roomCode: string,
    type: SignalingMessageType,
    user: string,
    candidate?: RTCIceCandidateInit | null,
    sdp?: RTCSessionDescriptionInit | null
}

export enum SignalingMessageType {
    iceCandidate = 'new-ice-candidate',
    offer = 'offer',
    answer = 'answer',
}
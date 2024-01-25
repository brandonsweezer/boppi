export type SignalingMessage = {
    roomCode: string,
    type: SingalingMessageType,
    user: string,
    candidate?: RTCIceCandidate,
    sdp?: RTCSessionDescription | null
}

export type SingalingMessageType = 'new-ice-candidate' | 'offer' | 'answer'
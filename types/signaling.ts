export type SignalingMessage = {
    type: SingalingMessageType,
    candidate?: RTCIceCandidate,
    sdp?: RTCSessionDescription | null
}

export type SingalingMessageType = 'new-ice-candidate' | 'offer' | 'answer'
import { SignalingMessage, SignalingMessageType } from "@/types/signaling";
import { RefObject } from "react";

export const initializeConnection = function (
        sendMessage: (message: SignalingMessage) => Promise<Response>,
        remoteVideo: RefObject<HTMLVideoElement | null>,
        username: string,
        roomCode: string,
    ) {
    const config: RTCConfiguration = {
        iceServers: [
            {
                urls: [
                    // process.env.NEXT_PUBLIC_STUN_SERVER_1 ?? '',
                    process.env.NEXT_PUBLIC_STUN_SERVER_2 ?? '',
                ]
            },
            {
                urls: process.env.NEXT_PUBLIC_TURN_URL ?? '',
                username: process.env.NEXT_PUBLIC_TURN_USERNAME,
                credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL
            },
        ],
        iceCandidatePoolSize: 10,
    }

    const pc = new RTCPeerConnection(config);

    pc.onnegotiationneeded = async function () {
        if (!pc) return;
        try {
            await pc.setLocalDescription();
            await sendMessage({
                roomCode: roomCode,
                user: username,
                type: SignalingMessageType.offer,
                sdp: pc.localDescription
            });
        } catch (err) {
            console.error(err);
        }
    }

    pc.onicecandidate = async function (event) {
        console.log(event)
        try {
            await sendMessage({
                roomCode: roomCode,
                user: username,
                type: SignalingMessageType.iceCandidate,
                candidate: event.candidate,
            });
        } catch (err) { console.error(err) }
    }

    pc.onsignalingstatechange = function (event) {
        console.log('signaling state change: ', pc?.signalingState)
    }

    pc.oniceconnectionstatechange = function () {
        console.log(`ICE connection state change: ${pc?.iceConnectionState}`);
        if (pc && pc.iceConnectionState === 'failed') {
          console.error('ICE Connection Failed');
          // Notify the user about the failure
        }
    };

    pc.onicegatheringstatechange = async function () {
        // generate connection offer with agreed ice candidate
        if (pc && pc.iceGatheringState === 'complete') {
            console.log('sending real offer')
            // Send localDescription to the other peer using your signaling mechanism
            await sendMessage({
                roomCode: roomCode,
                type: SignalingMessageType.offer,
                user: username,
                sdp: pc.localDescription
            })
        }
     };

    pc.ontrack = function (event) {
        if (!remoteVideo.current) return;
        console.log('setting track', event);
        remoteVideo.current.srcObject = event.streams[0];
    }

    return pc;
}
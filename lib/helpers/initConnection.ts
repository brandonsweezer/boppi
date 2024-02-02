import { MutableRefObject, RefObject } from "react";

import { SignalingMessage, SignalingMessageType } from "@/types/signaling";
import { sendMessage } from "./sendMessage";

export const initConnection = function (
    remoteVideo: RefObject<HTMLVideoElement | null>,
    username: string,
    roomCode: string,
    makingOffer: MutableRefObject<Boolean>,
    setConnectionStatus: (newValue: string) => void,
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
        console.log('negotiation needed', pc)
        if (!pc) return;

        try {
            makingOffer.current = true;
            // const offerConfig = await pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: true })? // TODO: use this when no video?
            await pc.setLocalDescription();
            await sendMessage({
                roomCode: roomCode,
                user: username,
                type: SignalingMessageType.offer,
                sdp: pc.localDescription
            });
        } catch (err) {
            console.error(err);
        } finally {
            makingOffer.current = false;
        }
    }

    pc.onicecandidate = async function (event) {
        // console.log('sending ice candidate')
        try {
            await sendMessage({
                roomCode: roomCode,
                user: username,
                type: SignalingMessageType.iceCandidate,
                candidate: event.candidate,
            });
        } catch (err) { console.error(err) }
    }

    // pc.onsignalingstatechange = function () {
    //     console.log('signaling state change: ', pc?.signalingState);
    // }

    pc.onconnectionstatechange = function () {
        console.log('connection state change: ', pc?.connectionState);
        setConnectionStatus(pc.connectionState);
        // handle disconnection
        if (pc.connectionState === 'disconnected') console.log('connection terminated, disconnecting');
    }

    pc.ontrack = function (event) {
        if (!remoteVideo.current) return;
        console.log('setting track', event);
        remoteVideo.current.srcObject = event.streams[0];
    }

    return pc;
}
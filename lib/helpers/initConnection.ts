import { MutableRefObject, RefObject } from "react";

import { SignalingMessage, SignalingMessageType } from "@/types/signaling";
import { sendMessage } from "./sendMessage";

export const initConnection = function (
    remoteVideo: RefObject<HTMLVideoElement | null>,
    username: string,
    roomCode: string,
    makingOffer: MutableRefObject<Boolean>,
) {
    const config: RTCConfiguration = {
        iceServers: [
            // {
            //     urls: [
            //         // process.env.NEXT_PUBLIC_STUN_SERVER_1 ?? '',
            //         process.env.NEXT_PUBLIC_STUN_SERVER_2 ?? '',
            //     ]
            // },
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
        console.log('sending ice candidate')
        try {
            await sendMessage({
                roomCode: roomCode,
                user: username,
                type: SignalingMessageType.iceCandidate,
                candidate: event.candidate,
            });
        } catch (err) { console.error(err) }
    }

    pc.onsignalingstatechange = function () {
        console.log('signaling state change: ', pc?.signalingState);
    }

    pc.onconnectionstatechange = function () {
        console.log('connection state change: ', pc?.connectionState);
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
            // console.log('sending real offer')
            // Send localDescription to the other peer using your signaling mechanism
            // await sendMessage({
            //     roomCode: roomCode,
            //     type: SignalingMessageType.offer,
            //     user: username,
            //     sdp: pc.localDescription
            // })
        }
     };

    pc.ontrack = function (event) {
        if (!remoteVideo.current) return;
        console.log('setting track', event);
        remoteVideo.current.srcObject = event.streams[0];
    }

    return pc;
}
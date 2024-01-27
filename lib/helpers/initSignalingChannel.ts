
import Pusher from "pusher-js";
import { MutableRefObject, SetStateAction } from "react";

import {
    SignalingMessage,
    SignalingMessageType,
    EstablishingMessageType,
} from "@/types/signaling";
import { sendMessage } from "./sendMessage";

const pusher = new Pusher(
    process.env.NEXT_PUBLIC_PUSHER_APP_KEY ?? '', {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? '',
});

export const initSignalingChannel = async function(
    setConnectionStatus: (newValue: string) => void,
    connectionEstablished: MutableRefObject<Boolean>,
    connection: MutableRefObject<RTCPeerConnection | null>,
    username: string,
    impolite: boolean,
    roomCode: string,
    fetchMakingOffer: () => boolean,
) {
    const signalingChannel = pusher.subscribe(roomCode)

    let ignoreOffer = false;
    signalingChannel.bind('client-message', async function (message: SignalingMessage) {
        // ignore messages from self
        if (message.user === username) return false;

        // EstablishingMessage
        if (message.establisherContent) {
            switch (message.establisherContent) {
                case EstablishingMessageType.ping:
                    // recieved ping, respond with pong and consider connection established
                    try {
                        await sendMessage({
                            user: username,
                            roomCode: roomCode,
                            type: SignalingMessageType.establisher,
                            establisherContent: EstablishingMessageType.pong
                        });
                        console.log('recieved ping, replied with pong');
                        connectionEstablished.current = true;
                        setConnectionStatus('ready to pair');
                        return;
                    } catch (err) { console.log(err) }
                    break;
                case EstablishingMessageType.pong:
                    // recieved pong, consider connection established
                    console.log('recieved pong');
                    connectionEstablished.current = true;
                    setConnectionStatus('ready to pair');
                    break;
            }
        }

        // SignalingMessage
        if (message.type) {
            try {
                if (!connection.current) return;
                console.log(message);
    
                switch (message.type) {
                    case SignalingMessageType.offer:
                        try {
                            console.log('recieving offer');

                            const makingOffer = fetchMakingOffer();
                            console.log('makingOffer', makingOffer);
                            console.log('signalingState', connection.current.signalingState);
                            console.log('impolite', impolite);

                            const offerCollision = makingOffer || connection.current.signalingState !== 'stable';
                            ignoreOffer = impolite && offerCollision;
                            if (ignoreOffer || !message.sdp) break;
    
                            // check progress
                            console.log('entertaining offer');
    
                            // entertaining an offer, so we set it as remote.
                            await connection.current.setRemoteDescription(message.sdp);
                            // generates "perfect condition" answer
                            await connection.current.setLocalDescription();
                            console.log('answer sdp', connection.current.localDescription);
                            await sendMessage({
                                roomCode: roomCode,
                                user: username,
                                type: SignalingMessageType.answer,
                                sdp: connection.current.localDescription
                            });
                        } catch (err) { console.log(err) }
                        break;
                    case SignalingMessageType.answer:
                        console.log('received an answer');
                        if (!message.sdp) { console.log('no description on answer'); return; };
                        // set the remote description
                        console.log('init connection using agreed ice candidate')
                        await connection.current.setRemoteDescription(message.sdp);
                        break;
                    case SignalingMessageType.iceCandidate:
                        console.log('__iceCandidate');
    
                        // throwing error when there was no remote description...
                        if (!connection.current.remoteDescription) return;
    
                        try {
                            if (!message.candidate) { console.log('candidate: ', message.candidate); return; }
                            await connection.current.addIceCandidate(message.candidate);
                        } catch (err) {
                            console.log('error in __iceCandidate')
                            if (!ignoreOffer) { throw err }
                        }
                        break;
                }
            } catch (err) {
                console.error('connection logic problem:')
                console.error(err)
            }

        }
    })

    return signalingChannel;
}
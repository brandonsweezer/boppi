import { SignalingMessage, SignalingMessageType } from "@/types/signaling";
import Pusher from "pusher-js";
import { MutableRefObject } from "react";

const pusher = new Pusher(
    process.env.NEXT_PUBLIC_PUSHER_APP_KEY ?? '', {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? '',
});

export const initializeSignalingChannel = async function (
        sendMessage: (message: SignalingMessage) => Promise<Response>,
        connection: MutableRefObject<RTCPeerConnection | null>,
        username: string,
        impolite: boolean,
        roomCode: string,
    ) {
    let ignoreOffer = false;
    const signalingChannel = pusher.subscribe(roomCode); // should be the room code?

    signalingChannel.bind('client-message', async function (message: SignalingMessage) {
        console.log(message);
        try {
            if (!connection.current) return;
            // ignore messages from self
            if (message.user === username) return;

            switch (message.type) {
                case SignalingMessageType.offer:
                    console.log('recieving offer');

                    // offer collision exists if making offer or non-stable connection
                    const offerCollision = connection.current.signalingState !== 'stable';
                    ignoreOffer = impolite || offerCollision;
                    if (ignoreOffer || !message.sdp) return;

                    try {
                        // got an offer, so we set it as remote.
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
                    if (!message.sdp) {console.log('no description on answer'); return};
                    // set the remote description
                    console.log('init connection using agreed ice candidate')
                    await connection.current.setRemoteDescription(message.sdp);
                    break;
                case SignalingMessageType.iceCandidate:
                    console.log('__iceCandidate');
                    // throwing error when there was no remote description...
                    if (!connection.current.remoteDescription) return;
                    try {
                        if (!message.candidate) {console.log('candidate: ', message.candidate); return;}
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
    })

    return signalingChannel;
}
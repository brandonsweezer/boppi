"use client"
import { useEffect, useRef, useState } from "react"
import adapter from "webrtc-adapter";
import Pusher, { Channel } from 'pusher-js';

import { SignalingMessage, SignalingMessageType } from "@/types/signaling";


const pusher = new Pusher(
    process.env.NEXT_PUBLIC_PUSHER_APP_KEY ?? '', {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? '',
})

export default function V1() {
    const impolite = false;
    const [makingOffer, setMakingOffer] = useState(false);

    const username = useRef('creepywatcher');
    const signalingChannel = useRef<Channel | null>(null);
    const remoteVideo = useRef<HTMLVideoElement>(null);
    const connection = useRef<RTCPeerConnection | null>(null);

    const call = async function () {
        console.log('attempting to join');
        try {
            signalingChannel.current = await initSignalingChannel();

            const pc = initializeConnection();
            connection.current = pc;
        } catch (e) { console.error(e) }
    }

    const endStream = async function () {
        console.log('ending');
        if (connection.current) connection.current.close();
    }
    
    const sendMessage = async (message: SignalingMessage) => {
        return fetch('/api/signaling', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message)
        })
    }

    const initializeConnection = function () {
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
                setMakingOffer(true);
                await pc.setLocalDescription();
                await sendMessage({
                    roomCode: '1',
                    user: username.current,
                    type: SignalingMessageType.offer,
                    sdp: pc.localDescription
                });
            } catch (err) {
                console.error(err);
            } finally {
                setMakingOffer(false);
            }
        }

        pc.onicecandidate = async function (event) {
            console.log(event)
            try {
                await sendMessage({
                    roomCode: '1',
                    user: username.current,
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
                setMakingOffer(true);
                // Send localDescription to the other peer using your signaling mechanism
                await sendMessage({
                    roomCode: '1',
                    type: SignalingMessageType.offer,
                    user: username.current,
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

    const initSignalingChannel = async function () {
        let ignoreOffer = false;
        const signalingChannel = pusher.subscribe('signaling'); // should be the room code?

        signalingChannel.bind('client-message', async function (message: SignalingMessage) {
            console.log(message);
            try {
                if (!connection.current) return;
                // ignore messages from self
                if (message.user === username.current) return;

                switch (message.type) {
                    case SignalingMessageType.offer:
                        console.log('recieving offer');

                        // offer collision exists if making offer or non-stable connection
                        const offerCollision = connection.current.signalingState !== 'stable';
                        ignoreOffer = impolite || offerCollision;
                        if (ignoreOffer || !message.sdp || makingOffer) return;

                        try {
                            // got an offer, so we set it as remote.
                            await connection.current.setRemoteDescription(message.sdp);
                            // generates "perfect condition" answer
                            await connection.current.setLocalDescription();
                            console.log('answer sdp', connection.current.localDescription);
                            await sendMessage({
                                roomCode: '1',
                                user: username.current,
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

    useEffect(() => {
        return () => {
            if (!signalingChannel.current) return;

            console.log('cleaning up!');
            signalingChannel.current.unbind_all();
            signalingChannel.current.unsubscribe();
            pusher.disconnect();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <div style={{display: 'flex', marginLeft: 'auto', marginRight: 'auto', gap: '1rem'}}>
                <div style={{display: 'flex', flexDirection: 'column'}}>
                    <h2 style={{marginLeft: 'auto', marginRight: 'auto'}}>Local Stream</h2>
                    <video ref={remoteVideo} style={{ width: '100%', backgroundColor: '#615d5d', borderRadius: '2px'}} autoPlay></video>
                </div>
            </div>
            <div style={{display: 'flex', gap: '1rem', marginLeft: 'auto', marginRight: 'auto'}}>
                <button onClick={call} style={{padding: '.5rem 1rem .5rem 1rem', paddingLeft: '1rem', paddingRight: '1rem', borderRadius: 4}}>Join</button>
                <button onClick={endStream} style={{padding: '.5rem 1rem .5rem 1rem', paddingLeft: '1rem', paddingRight: '1rem', borderRadius: 4}}>End</button>
            </div>
        </div>
    );
}
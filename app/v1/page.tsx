"use client"
import { useEffect, useRef, useState } from "react"
import adapter from "webrtc-adapter";
import Pusher from 'pusher-js';

import { SignalingMessage } from "@/types/signaling";


const pusher = new Pusher(
    process.env.NEXT_PUBLIC_PUSHER_APP_KEY ?? '', {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? '',
})

export default function V1() {
    const [isFirstRender, setIsFirstRender] = useState(true);
    const username = useRef('');

    const localVideo = useRef<HTMLVideoElement>(null);
    const remoteVideo = useRef<HTMLVideoElement>(null);
    const connection = useRef<RTCPeerConnection | null>(null);

    const startStream = async function () {
        const pc = initializeConnection();
        connection.current = pc;

        const stream = await navigator.mediaDevices.getDisplayMedia({video: true, audio: true})
        if (!localVideo.current) return;
        localVideo.current.srcObject = stream;

        stream.getTracks().forEach(track => pc.addTrack(track, stream))

    }

    const call = async function () {
        const pc = initializeConnection();
        const offer = await pc.createOffer({offerToReceiveAudio: true, offerToReceiveVideo: true})
        console.log('made offer...?');
        await pc.setLocalDescription(new RTCSessionDescription(offer))
        connection.current = pc;
    }
    
    const sendMessage = async (message: SignalingMessage) => {
        return fetch('/api/signaling', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(message)
        })
    }

    const sendHello = async () => {
        return fetch('/api/signaling', {
            method: 'GET'
        })
    }

    const handleOffer = async function (message: SignalingMessage) {
        if (!connection.current) return;
        if (!message.sdp) {
            console.error('no SDP provided in offer message!')
            return;
        };
        console.log('setting remote description')
        await connection.current.setRemoteDescription(message.sdp);

        console.log('creating answer')
        const answer = await connection.current.createAnswer()

        console.log('setting local description')
        await connection.current.setLocalDescription(new RTCSessionDescription(answer))

        console.log('sending answer message')
        await sendMessage({
            roomCode: '1',
            type: 'answer',
            user: username.current,
            sdp: connection.current.localDescription
        });
        
    }

    const initializeConnection = function () {
        const configuration: RTCConfiguration = {
            iceServers: [
                {
                    urls: [
                        process.env.NEXT_PUBLIC_STUN_SERVER_1 ?? '',
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
        const pc = new RTCPeerConnection(configuration);

        pc.onicecandidate = async function ({candidate}) {
            if (candidate) {
                await sendMessage({
                    roomCode: '1',
                    type: 'new-ice-candidate',
                    user: username.current,
                    candidate: candidate
                })
            }
        }

        pc.onnegotiationneeded = async function () {
            try {
                if (!pc) return;
                const offer = await pc.createOffer();
                await pc.setLocalDescription(new RTCSessionDescription(offer));
            } catch (err) {
                console.error(err);
            }
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
            if (pc && pc.iceGatheringState === 'complete') {
                const localDescription = pc.localDescription;
                // Send localDescription to the other peer using your signaling mechanism
                await sendMessage({
                    roomCode: '1',
                    type: 'offer',
                    user: username.current,
                    sdp: pc.localDescription
                })
            }
         };

        pc.ontrack = function (event) {
            if (!remoteVideo.current) return;
            remoteVideo.current.srcObject = event.streams[0];
        }
        return pc;
    }

    useEffect(() => {
        const signalingChannel = pusher.subscribe('signaling'); // should be the room code?
        signalingChannel.bind('client-message', async function (message: SignalingMessage) {
            if (message.user === username.current) return;
            console.log(message.user, username.current);
            console.log(message);
            switch (message.type) {
              case 'offer':
                console.log('__offer')
                await handleOffer(message)
                break;
              case 'answer':
                console.log('__answer')
                if (!connection.current || connection.current.signalingState === 'stable') return;
                if (!message.sdp) {
                    console.error('no SDP provided in answer message!')
                    return;
                };
                await connection.current.setRemoteDescription(message.sdp);
                break;
              case 'new-ice-candidate':
                console.log('__ice-candidate')
                if (!connection.current || !connection.current.remoteDescription) return;
                await connection.current.addIceCandidate(message.candidate);
                break;
              default:
                console.error(`Unknown message type: ${message.type}`);
            }
        })

        return () => {
            if (isFirstRender) {
                setIsFirstRender(false);
                return;
            }
            console.log('cleaning up!');
            signalingChannel.unbind_all();
            signalingChannel.unsubscribe();
            pusher.disconnect();
        }
    }, [])

    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <div style={{display: 'flex', marginLeft: 'auto', marginRight: 'auto', gap: '1rem'}}>
                <div style={{display: 'flex', flexDirection: 'column'}}>
                    <h2>Local Stream</h2>
                    <video ref={localVideo} style={{ width: '500px', backgroundColor: 'blue'}} autoPlay></video>
                </div>
                <div style={{display: 'flex', flexDirection: 'column'}}>
                    <h2>Remote Stream</h2>
                    <video ref={remoteVideo} style={{width: '500px', backgroundColor: 'green'}} autoPlay></video>
                </div>
            </div>
            <div style={{display: 'flex', gap: '1rem', marginLeft: 'auto', marginRight: 'auto'}}>
                <button onClick={startStream} style={{padding: '.5rem 1rem .5rem 1rem', paddingLeft: '1rem', paddingRight: '1rem', borderRadius: 4}}>Start</button>
                <button onClick={call} style={{padding: '.5rem 1rem .5rem 1rem', paddingLeft: '1rem', paddingRight: '1rem', borderRadius: 4}}>Call</button>
                <button style={{padding: '.5rem 1rem .5rem 1rem', paddingLeft: '1rem', paddingRight: '1rem', borderRadius: 4}}>Hangup</button>
            </div>
            <input type="text" onChange={(e) => username.current = e.target.value} placeholder="username"/>
            <button onClick={sendHello}>Say Hi</button>
        </div>
    );
}
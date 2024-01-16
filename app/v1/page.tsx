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

    const localVideo = useRef<HTMLVideoElement>(null);
    const remoteVideo = useRef<HTMLVideoElement>(null);
    const pc = useRef<RTCPeerConnection | null>(null);

    const startStream = async () => {
        const stream = await navigator.mediaDevices.getDisplayMedia({video: true, audio: true})
        if (!localVideo.current) return;
        localVideo.current.srcObject = stream;

        initializeStream();

        stream.getTracks().forEach(track => pc.current?.addTrack(track, stream))
    }

    const call = async () => {
        if (!pc.current) return;
        const offer = await pc.current.createOffer({offerToReceiveAudio: true, offerToReceiveVideo: true})
        console.log('2');
        await pc.current.setLocalDescription(new RTCSessionDescription(offer))
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

    const handleOffer = async (message: SignalingMessage) => {
        if (!pc.current) return;
        if (!message.sdp) {
            console.error('no SDP provided in offer message!')
            return;
        };
        console.log('setting remote description')
        await pc.current.setRemoteDescription(message.sdp);

        const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true})
        stream.getTracks().forEach(track => pc.current?.addTrack(track, stream))

        console.log('creating answer')
        const answer = await pc.current.createAnswer()

        console.log('setting local description')
        await pc.current.setLocalDescription(new RTCSessionDescription(answer))

        console.log('sending answer message')
        await sendMessage({
            type: 'answer',
            sdp: pc.current.localDescription
        });
        
    }

    const initializeStream = () => {
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
        pc.current = new RTCPeerConnection(configuration);

        pc.current.onicecandidate = async ({candidate}) => {
            if (candidate) {
                await sendMessage({
                    type: 'new-ice-candidate',
                    candidate: candidate
                })
            }
        }

        pc.current.onnegotiationneeded = async () => {
            try {
                if (!pc.current) return;
                const offer = await pc.current.createOffer();
                console.log('1')
                await pc.current.setLocalDescription(new RTCSessionDescription(offer));
            } catch (err) {
                console.error(err);
            }
        }

        pc.current.onsignalingstatechange = (event) => {
            console.log('signaling state change: ', pc.current?.signalingState)
        }

        pc.current.oniceconnectionstatechange = () => {
            console.log(`ICE connection state change: ${pc.current?.iceConnectionState}`);
            if (pc.current && pc.current.iceConnectionState === 'failed') {
              console.error('ICE Connection Failed');
              // Notify the user about the failure
            }
        };

        pc.current.onicegatheringstatechange = async () => {
            if (pc.current && pc.current.iceGatheringState === 'complete') {
                const localDescription = pc.current.localDescription;
                // Send localDescription to the other peer using your signaling mechanism
                await sendMessage({
                    type: 'offer',
                    sdp: pc.current.localDescription
                })
            }
         };

        pc.current.ontrack = (event) => {
            if (!remoteVideo.current) return;
            remoteVideo.current.srcObject = event.streams[0];
        }
    }

    useEffect(() => {
        const signalingChannel = pusher.subscribe('signaling');
        signalingChannel.bind('client-message', async (message: SignalingMessage) => {
            switch (message.type) {
              case 'offer':
                console.log('__offer')
                await handleOffer(message)
                break;
              case 'answer':
                console.log('__answer')
                if (!pc.current || pc.current.signalingState === 'stable') return;
                if (!message.sdp) {
                    console.error('no SDP provided in answer message!')
                    return;
                };
                await pc.current.setRemoteDescription(message.sdp);
                break;
              case 'new-ice-candidate':
                console.log('__ice-candidate')
                if (!pc.current || !pc.current.remoteDescription) return;
                await pc.current.addIceCandidate(message.candidate);
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
        </div>
    )
}
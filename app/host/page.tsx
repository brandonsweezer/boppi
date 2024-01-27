"use client"
import { useEffect, useRef, useState } from "react"
import adapter from "webrtc-adapter";
import Pusher, { Channel } from 'pusher-js';

import { v4 as uuid } from 'uuid'

import { SignalingMessage, SignalingMessageType } from "@/types/signaling";
import { useSearchParams } from "next/navigation";
import { initializeConnection } from "../initializeConnection";
import { initializeSignalingChannel } from "../initializeSignalingChannel";


export default function Host() {
    const [username, setUsername] = useState('host');
    
    const impolite = false;
    const [makingOffer, setMakingOffer] = useState(false);

    const signalingChannel = useRef<Channel | null>(null);
    const localVideo = useRef<HTMLVideoElement>(null);
    const connection = useRef<RTCPeerConnection | null>(null);

    const [roomCode, setRoomCode] = useState('');

    const generateRoomCode = () => {
        const roomcode = uuid();
        setRoomCode(roomcode);
        return roomcode;
    }

    const startStream = async function () {
        const roomcode = generateRoomCode();
        try {
            signalingChannel.current = await initializeSignalingChannel(sendMessage, connection, username, impolite, roomcode);

            const pc = initializeConnection(sendMessage, localVideo, username, roomcode);
            connection.current = pc;
    
            // const stream = await navigator.mediaDevices.getDisplayMedia({video: true, audio: true})
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
            })
            const tracks = stream.getVideoTracks();
            for (let i = 0; i < tracks.length; i++) {
                tracks[i].applyConstraints({frameRate: {max: 60}})
            }

            
            stream.getTracks().forEach(track => pc.addTrack(track, stream))

            if (!localVideo.current) return;
            localVideo.current.srcObject = stream;
        } catch (e) { console.error(e) }
  }

    const endStream = async function () {
      console.log('ending');
      if (connection.current) connection.current.close();
      if (localVideo.current) localVideo.current.srcObject = null;
  }
    
    const sendMessage = async (message: SignalingMessage) => {
        return fetch('/api/signaling', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message)
        })
    }

    useEffect(() => {
        return () => {
            if (!signalingChannel.current) return;

            console.log('cleaning up!');
            signalingChannel.current.unbind_all();
            signalingChannel.current.unsubscribe();
        }
    }, [])

    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <div style={{display: 'flex', marginLeft: 'auto', marginRight: 'auto', gap: '1rem'}}>
              <div style={{display: 'flex', flexDirection: 'column'}}>
                    <video ref={localVideo} style={{ width: '100%', backgroundColor: '#615d5d', borderRadius: '2px'}} autoPlay></video>
                </div>
            </div>
            <div style={{display: 'flex', gap: '1rem', marginLeft: 'auto', marginRight: 'auto'}}>
                <button onClick={startStream} style={{padding: '2rem', borderRadius: 4}}>Start Streaming</button>
                <button onClick={endStream} style={{padding: '2rem', borderRadius: 4}}>Stop Streaming</button>
            </div>
            {roomCode && <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginLeft: 'auto', marginRight: 'auto'}}>
                <h3>Room Code:</h3>
                <h1>{roomCode}</h1>
            </div>}
        </div>
    );
}
"use client"
import { useEffect, useRef, useState } from "react"
import adapter from "webrtc-adapter";
import { Channel } from 'pusher-js';

import { SignalingMessage } from "@/types/signaling";
import { useParams } from "next/navigation";
import { initializeConnection } from "../initializeConnection";
import { initializeSignalingChannel } from "../initializeSignalingChannel";


export default function Join() {
    const params = useParams();
    const [roomCode, setRoomCode] = useState(`${params.roomCode}`);
    const [username, setUsername] = useState(params.roomCode ? 'creepywatcher' : 'host');
    const impolite = false;

    const [connectionStatus, setConnectionStatus] = useState('');

    const signalingChannel = useRef<Channel | null>(null);
    const remoteVideo = useRef<HTMLVideoElement>(null);
    const connection = useRef<RTCPeerConnection | null>(null);

    const call = async function () {
        setConnectionStatus('Joining stream...');
        try {
            setConnectionStatus('Initializing signaling channel...');
            signalingChannel.current = await initializeSignalingChannel(sendMessage, connection, username, impolite, roomCode);

            setConnectionStatus('Initializing peer connection...');
            const pc = initializeConnection(sendMessage, remoteVideo, username, roomCode);
            connection.current = pc;
        } catch (e) { console.error(e) }
    }
    
    const sendMessage = async (message: SignalingMessage) => {
        return fetch('/api/signaling', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message)
        })
    }

    if (connection.current) {
        connection.current.oniceconnectionstatechange = function () {
            if (connection.current) {
                setConnectionStatus(connection.current.iceConnectionState)
            }
        };
    }
    

    useEffect(() => {
        call();

        return () => {
            if (!signalingChannel.current) return;

            console.log('cleaning up!');
            signalingChannel.current.unbind_all();
            signalingChannel.current.unsubscribe();
        }
    }, [])

    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <h1>{username}</h1>
            <h1>{params.roomCode}</h1>
            <div style={{display: 'flex', marginLeft: 'auto', marginRight: 'auto', gap: '1rem'}}>
                <div style={{display: 'flex', flexDirection: 'column'}}>
                    <h2 style={{marginLeft: 'auto', marginRight: 'auto'}}>Remote Stream</h2>
                    <video ref={remoteVideo} style={{ width: '100%', backgroundColor: '#615d5d', borderRadius: '2px'}} autoPlay></video>
                </div>
            </div>
            <div style={{display: 'flex', gap: '1rem', marginLeft: 'auto', marginRight: 'auto'}}>
                <p>{connectionStatus}</p>
            </div>
        </div>
    );
}
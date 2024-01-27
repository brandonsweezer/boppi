"use client"
import { useEffect, useRef, useState } from "react"
import adapter from "webrtc-adapter";
import Pusher, { Channel } from 'pusher-js';

import { v4 as uuid } from 'uuid'

import { SignalingMessage, SignalingMessageType, EstablishingMessageType } from "@/types/signaling";
import { useSearchParams } from "next/navigation";
import { initConnection } from "../../lib/helpers/initConnection";
import { initSignalingChannel } from "../../lib/helpers/initSignalingChannel";
import { sendMessage } from "../../lib/helpers/sendMessage";
import { errorMonitor } from "stream";


export default function Host() {
    // RTCPeerConnection Variables
    const impolite = true;
    const makingOffer = useRef<boolean>(false);

    const [username, setUsername] = useState('host');

    const [xRes, setXRes] = useState(1920);
    const [yRes, setYRes] = useState(1080);
    const [fps, setFps] = useState(30);
    
    const signalingChannel = useRef<Channel | null>(null);
    const localVideo = useRef<HTMLVideoElement>(null);
    const connection = useRef<RTCPeerConnection | null>(null);

    const connectionEstablished = useRef<Boolean>(false);
    const [connectionStatus, setConnectionStatus] = useState('waiting for others to join session');

    const [roomCode, setRoomCode] = useState('');

    const generateRoomCode = () => {
        const roomcode = uuid();
        setRoomCode(roomcode);
        return roomcode;
    }

    const initializeSignalingChannel = async function (roomCode: string) {
        signalingChannel.current = await initSignalingChannel(
            setConnectionStatus,
            connectionEstablished,
            connection,
            username,
            impolite,
            roomCode,
            () => makingOffer.current,
        );

        console.log('channel init', roomCode)
        await sendMessage({
            user: username,
            roomCode: roomCode,
            type: SignalingMessageType.establisher,
            establisherContent: EstablishingMessageType.ping
        });
    }

    const initRTCPeerConnection = async function () {
        try {
            const pc = initConnection(
                localVideo,
                username,
                roomCode,
                makingOffer,
            );
            connection.current = pc;
        } catch (err) { console.error(err) }
    }

    const startStream = async function () {
        // const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: false})
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false,
        })

        const tracks = stream.getVideoTracks();
        for (let i = 0; i < tracks.length; i++) {
            tracks[i].applyConstraints({
                frameRate: {max: fps},
                width: { min: 640, ideal: xRes},
                height: { min: 480, ideal: yRes},
            })
        }

        const allTracks = stream.getTracks();
        if (connection.current) {
            console.log('connection exists while setting up video');
            for (let i = 0; i < allTracks.length; i++) {
                connection.current.addTrack(allTracks[i], stream);
            }
        }

        if (!localVideo.current) return;
        localVideo.current.srcObject = stream;
    }

    const endStream = async function () {
        console.log('ending');
        // if (connection.current) connection.current.close();
        if (localVideo.current) localVideo.current.srcObject = null;
    }

    useEffect(() => {
        console.log('change to connectionStatus detected', connectionEstablished.current, connection.current);
        if (connectionEstablished.current && !connection.current) {
            console.log('beginning to initpeer ocnnection')
            initRTCPeerConnection();
        }

        return () => {
            // cleanup
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connectionStatus]);

    useEffect(() => {
        const initRoomCode = generateRoomCode();
        // init pusher connection and send connection establishment message
        initializeSignalingChannel(initRoomCode);

        return () => {
            // end RTCPeerConnection
            if (connection.current) connection.current.close();

            if (!signalingChannel.current) return;

            // end Pusher channel
            signalingChannel.current.unbind_all();
            signalingChannel.current.unsubscribe();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
            <div style={{display: 'flex', gap: '1rem', marginLeft: 'auto', marginRight: 'auto'}}>
                <p>{connectionStatus}</p>
            </div>
            <div style={{display: 'flex'}}>
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginLeft: 'auto', marginRight: 'auto'}}>
                    <label>Max Fps:</label>
                    <input onChange={(e) => setFps(+e.target.value)} type="number" placeholder="Max FPS" />
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginLeft: 'auto', marginRight: 'auto'}}>
                    <label>Max resolution x:</label>
                    <input onChange={(e) => setXRes(+e.target.value)} type="number" placeholder="Max Width" />
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginLeft: 'auto', marginRight: 'auto'}}>
                    <label>Max resolution y:</label>
                    <input onChange={(e) => setYRes(+e.target.value)} type="number" placeholder="Max Width" />
                </div>
            </div>
            {roomCode && <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginLeft: 'auto', marginRight: 'auto'}}>
                <h3>Room Code:</h3>
                <h1>{roomCode}</h1>
            </div>}
        </div>
    );
}
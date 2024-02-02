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
    const username = 'host';
    const makingOffer = useRef<boolean>(false);

    const [xRes, setXRes] = useState(1920);
    const [yRes, setYRes] = useState(1080);
    const [fps, setFps] = useState(30);
    
    const signalingChannel = useRef<Channel | null>(null);
    const localVideo = useRef<HTMLVideoElement>(null);
    const connection = useRef<RTCPeerConnection | null>(null);
    const mediaStream = useRef<MediaStream | null>(null);

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
                setConnectionStatus,
            );
            connection.current = pc;
        } catch (err) { console.error(err) }
    }
    
    if (connection.current) {
        connection.current.onconnectionstatechange = function () {
            if (connection.current) {
                console.log('jeez louise!! setting connectionStatus to', connection.current.connectionState)
                setConnectionStatus(connection.current.connectionState);
            }  
            // handle disconnection
            if (connection.current && connection.current.connectionState === 'disconnected') {
                console.log('connection terminated, disconnecting');
                connection.current = null;
            }
        }
    }

    const startStream = async function () {
        // restart connection if ended previously
        if (!connection.current) await initRTCPeerConnection();

        // if mediaStream already exists, handle and return
        if (
            mediaStream.current
            && localVideo.current
            && !localVideo.current.srcObject
        ) {
            console.log('rly weird case lol')
            localVideo.current.srcObject = mediaStream.current;
        }

        // get video if it doesn't exist
        // if (!mediaStream.current) mediaStream.current = await navigator.mediaDevices.getUserMedia({
        //     video: true,
        //     audio: false,
        // })
        if (!mediaStream.current) mediaStream.current = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false,
        })

        const tracks = mediaStream.current.getTracks();
        for (let i=0; i<tracks.length; i++) {
            if (tracks[i].kind === 'video') tracks[i].applyConstraints({
                frameRate: { max: fps },
                width: { min: 640, ideal: xRes },
                height: { min: 480, ideal: yRes },
            });
            // apply audio constraints here

            if (connection.current) connection.current.addTrack(tracks[i], mediaStream.current);
        }

        if (!localVideo.current) return;
        localVideo.current.srcObject = mediaStream.current;
    }

    const endStream = async function () {
        console.log('ending');
        if (connection.current) {
            connection.current.close(); // close connection
            connection.current = null; // delete connection object
        }
        setConnectionStatus('disconnected'); // ui
    }

    useEffect(() => {
        console.log('change to connectionStatus detected', connectionEstablished.current, connection.current);
        if (connectionEstablished.current && !connection.current) {
            console.log('beginning to initpeer connection')
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
            <div style={{display: 'flex', gap: '1rem'}}>
                <video ref={localVideo} style={{ width: '100%', backgroundColor: '#615d5d', borderRadius: '2px'}} autoPlay></video>
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
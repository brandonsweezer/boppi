"use client"
import { useEffect, useRef, useState } from "react"
import adapter from "webrtc-adapter";
import { Channel } from 'pusher-js';

import { SignalingMessage, SignalingMessageType, EstablishingMessageType } from "@/types/signaling";
import { useParams } from "next/navigation";
import { initConnection } from "../../lib/helpers/initConnection";
import { initSignalingChannel } from "../../lib/helpers/initSignalingChannel";
import { sendMessage } from "../../lib/helpers/sendMessage";


export default function Join() {
    const params = useParams();
    const [username, setUsername] = useState('creepywatcher');
    const [roomCode, setRoomCode] = useState(`${params.roomCode}`);

    // RTCPeerConnection Variables
    const impolite = false;
    const makingOffer = useRef<boolean>(false);

    const connectionEstablished = useRef<Boolean>(false);
    const [connectionStatus, setConnectionStatus] = useState('waiting for others to join session');

    const signalingChannel = useRef<Channel | null>(null);
    const remoteVideo = useRef<HTMLVideoElement>(null);
    const connection = useRef<RTCPeerConnection | null>(null);

    const initializeSignalingChannel = async function () {
        signalingChannel.current = await initSignalingChannel(
            setConnectionStatus,
            connectionEstablished,
            connection,
            username,
            impolite,
            roomCode,
            () => makingOffer.current,
        );
        await sendMessage({
            user: username,
            roomCode: roomCode,
            type: SignalingMessageType.establisher,
            establisherContent: EstablishingMessageType.ping
        });
    }

    const join = async function () {
        try {
            // signalingChannel.current = await initSignalingChannel(
            //     setConnectionStatus,
            //     connectionEstablished,
            //     connection,
            //     username,
            //     impolite,
            //     roomCode,
            // );

            setConnectionStatus('ready to pair');
            const pc = initConnection(remoteVideo, username, roomCode, makingOffer);
            connection.current = pc;
        } catch (e) { console.error(e) }
    }

    if (connection.current) {
        connection.current.oniceconnectionstatechange = function () {
            if (connection.current) {
                setConnectionStatus(connection.current.iceConnectionState)
            }
        };
    }

    useEffect(() => {
        console.log('change to connectionEstablished detected', connectionEstablished.current);
        if (connectionEstablished.current) join();

        return () => {
            // cleanup
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connectionStatus]);

    useEffect(() => {
        // init pusher connection and send connection establishment message
        initializeSignalingChannel();

        return () => {
            if (!signalingChannel.current) return;

            console.log('cleaning up!');
            signalingChannel.current.unbind_all();
            signalingChannel.current.unsubscribe();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
"use client";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [connection, setConnection] = useState<RTCPeerConnection>();
  const [localStream, setLocalStream] = useState<MediaStream>();
  const [remoteStream, setRemoteStream] = useState<MediaStream>();


  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);

  const startStream = () => {
    navigator.mediaDevices.getDisplayMedia({video: true, audio: true}).then((lStream) => {
      setLocalStream(lStream);
      if (!connection) return;

      if (!localVideo.current) return;
      localVideo.current.srcObject = lStream;

      const newConnection = connection;
      lStream.getTracks().forEach((track) => {
        newConnection.addTrack(track, lStream);
      })
      setConnection(newConnection);
    });
    
  };

  const showRemoteStream = (event: RTCTrackEvent) => {
    if (!remoteVideo.current) return;
    remoteVideo.current.srcObject = event.streams[0]
  }

  useEffect(() => {
    const config = {
      iceServers: [
        {
          urls: process.env.NEXT_PUBLIC_TURN_URL ?? '',
          username: process.env.NEXT_PUBLIC_TURN_USERNAME ?? '',
          credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL ?? '',
        },
        {
          urls: [process.env.NEXT_PUBLIC_STUN_SERVER_1 ?? '', process.env.NEXT_PUBLIC_STUN_SERVER_2 ?? '']
        }
      ]
    }
    const conn = new RTCPeerConnection(config);

    console.log(conn.getStats())
    conn.ontrack = showRemoteStream;
    setConnection(conn);
  }, [])

  return (
    <main>
      <div>
        <video style={{width: 640, height: 360}} ref={localVideo} autoPlay></video>
      </div>
      <div>
        <video style={{width: 640, height: 360, backgroundColor: "white"}} ref={remoteVideo} autoPlay></video>
      </div>
      <button style={{padding: 6, marginRight: 16, color: "burlywood"}} onClick={startStream}>Stream</button>
    </main>
  )
}

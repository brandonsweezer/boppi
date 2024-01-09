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
  
      newConnection.ontrack = event => {
        console.log('got track')
        event.streams[0].getTracks().forEach(track => {
          console.log('each track')
          if (!remoteStream) return;
          console.log('remote stream exists')
          remoteStream.addTrack(track);
          if (!remoteVideo.current) return;
          console.log('remote video exists')
          remoteVideo.current.srcObject = event.streams[0];
        })
      }

      setConnection(newConnection);
    });
    
  };



  const joinStream = () => {
    console.log('joining stream')
    if (!remoteVideo.current) return;
    console.log('remote video exists');
    if (!remoteStream) return;
    console.log('remote stream exists');
    remoteVideo.current.srcObject = remoteStream;
  }

  useEffect(() => {
    const lStream = new MediaStream();
    setLocalStream(lStream);
    const rStream = new MediaStream();
    setRemoteStream(rStream);
    const config = {
      iceServers: [
        {
          urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        },
      ],
      iceCandidatePoolSize: 10,
    };
    const connection = new RTCPeerConnection(config);
    connection.ontrack = (event) => {
      
    }
    setConnection(connection);

    
    
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
      <button style={{padding: 6, marginRight: 16, color: "burlywood"}} onClick={joinStream}>Join</button>
    </main>
  )
}

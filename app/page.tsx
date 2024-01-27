"use client"
import { useEffect, useRef, useState } from "react"
import adapter from "webrtc-adapter";
import Pusher, { Channel } from 'pusher-js';

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');

  const goToRoom = () => {
    router.push(`/${roomCode}`)
  }

  const host = () => {
    router.push(`/host`)
  }
  
  return (
      <div style={{display: 'flex', flexDirection: 'column', textAlign: 'center', gap: '1rem'}}>
          <h1>Welcome to boppi!</h1>
          <div style={{display: 'flex', gap: '1rem', justifyContent: 'space-evenly'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', flexDirection: 'column', backgroundColor: '#2a2a2a', gap: '1rem', padding: '2rem'}}>
              <h3>Want to start a stream?</h3>
              <button style={{padding: '1rem'}} onClick={host}>Start a stream</button>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', backgroundColor: '#2a2a2a', gap: '1rem', padding: '2rem'}}>
              <h3>Know your room code? Enter it here:</h3>
              <input style={{padding: '1rem'}} type="text" placeholder="roomcode" onChange={(e) => setRoomCode(e.target.value)}/>
              <button style={{padding: '1rem'}} onClick={goToRoom}>Go!</button>
            </div>
          </div>
      </div>
  );
}
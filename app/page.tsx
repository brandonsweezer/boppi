"use client";
import { useRef } from "react";

export default async function Home() {
  const videos = useRef<HTMLVideoElement>(null);

  const startStream = async () => {
    if (!videos.current) return;
    const localStream = await navigator.mediaDevices.getDisplayMedia({video: true, audio: true});
    videos.current.srcObject = localStream;
    videos.current.onloadedmetadata = (e) => {
      if (!videos.current) return;
      videos.current.play();
    }
  };

  return (
    <main>
      <video ref={videos} autoPlay></video>
      <button onClick={startStream}>Stream</button>
    </main>
  )
}

"use client";
import { useEffect, useRef, useState } from "react";


const offerOptions = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};

export default function Home() {
  const [pc1, setPc1] = useState<RTCPeerConnection>();
  const [pc2, setPc2] = useState<RTCPeerConnection>();

  const [localStream, setLocalStream] = useState<MediaStream>();

  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);

  const startStream = () => {
    navigator.mediaDevices.getDisplayMedia({video: true, audio: true})
    .then((lStream) => {
      setLocalStream(lStream);

      if (!localVideo.current) return;
      localVideo.current.srcObject = lStream;
    })
    .catch(console.error)
  };

  const joinStream = async () => {
    if (!localStream) return;
    const videoTracks = localStream.getVideoTracks();
    const audioTracks = localStream.getAudioTracks();

    const configuration = {
      iceServers: [
        {
          urls: [process.env.NEXT_PUBLIC_STUN_SERVER_1 ?? '', process.env.NEXT_PUBLIC_STUN_SERVER_2 ?? '']
        },
        // {
        //   urls: process.env.NEXT_PUBLIC_TURN_URL ?? '',
        //   username: process.env.NEXT_PUBLIC_TURN_USERNAME,
        //   credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL
        // },
      ],
    };

    const pc1 = new RTCPeerConnection(configuration)
    pc1.addEventListener('icecandidate', e => onIceCandidate(pc1, e))

    const pc2 = new RTCPeerConnection(configuration);
    pc2.addEventListener('icecandidate', e => onIceCandidate(pc2, e))

    pc1.addEventListener('iceconnectionstatechange', e => onIceStateChange(pc1, e));
    pc2.addEventListener('iceconnectionstatechange', e => onIceStateChange(pc2, e));

    pc2.addEventListener('track', gotRemoteStream);

    for (const track of videoTracks) {
      pc1.addTrack(track, localStream);
      console.log('added local stream to pc1');
    }

    for (const track of audioTracks) {
      pc1.addTrack(track, localStream);
      console.log('added local stream to pc1');
    }

    try {
      console.log('pc1 createOffer start');
      const offer = await pc1.createOffer(offerOptions)
      await onCreateOfferSuccess(offer);
    } catch (e) {
      onCreateSessionDescriptionError(e as Error);
    }

    setPc1(pc1);
    setPc2(pc2);

  }

  function onCreateSessionDescriptionError(error: Error) {
    console.log(`Failed to create session description: ${error.toString()}`);
  }

  async function onCreateOfferSuccess(desc: RTCSessionDescriptionInit) {
    if (!pc1) return;
    if (!pc2) return;
    console.log(`Offer from pc1\n${desc.sdp}`);
    console.log('pc1 setLocalDescription start');
    try {
      await pc1.setLocalDescription(desc);
      setPc1(pc1);
      onSetLocalSuccess(pc1);
    } catch (e) {
      onSetSessionDescriptionError(e as Error);
    }
  
    console.log('pc2 setRemoteDescription start');
    try {
      await pc2.setRemoteDescription(desc);
      setPc2(pc2);
      onSetRemoteSuccess(pc2);
    } catch (e) {
      onSetSessionDescriptionError(e as Error);
    }
  
    console.log('pc2 createAnswer start');
    // Since the 'remote' side has no media stream we need
    // to pass in the right constraints in order for it to
    // accept the incoming offer of audio and video.
    try {
      const answer = await pc2.createAnswer();
      await onCreateAnswerSuccess(answer);
    } catch (e) {
      onCreateSessionDescriptionError(e as Error);
    }
  }

  async function onCreateAnswerSuccess(desc: RTCSessionDescriptionInit) {
    if (!pc1) return;
    if (!pc2) return;

    console.log(`Answer from pc2:\n${desc.sdp}`);
    console.log('pc2 setLocalDescription start');
    try {
      await pc2.setLocalDescription(desc);
      setPc2(pc2);
      onSetLocalSuccess(pc2);
    } catch (e) {
      onSetSessionDescriptionError(e as Error);
    }
    console.log('pc1 setRemoteDescription start');
    try {
      await pc1.setRemoteDescription(desc);
      setPc1(pc1);
      onSetRemoteSuccess(pc1);
    } catch (e) {
      onSetSessionDescriptionError(e as Error);
    }
    console.log('pc1 setRemoteDescription end');

  }

  function onSetSessionDescriptionError(error: Error) {
    console.log(`Failed to set session description: ${error.toString()}`);
  }

  function onSetLocalSuccess(pc: RTCPeerConnection) {
    console.log(`${pc === pc1 ? 'pc1': 'pc2'} setLocalDescription complete`);
  }
  
  function onSetRemoteSuccess(pc: RTCPeerConnection) {
    console.log(`${pc === pc1 ? 'pc1': 'pc2'} setRemoteDescription complete`);
  }
  

  const leaveStream = () => {
    console.log('leaving stream');
    pc1?.close();
    pc2?.close();
    setPc1(undefined);
    setPc2(undefined);
  }

  const gotRemoteStream = (event: RTCTrackEvent) => {
    if (!remoteVideo.current) return;
    if (remoteVideo.current.srcObject === event.streams[0]) return; // already got
    remoteVideo.current.srcObject = event.streams[0];
    console.log('pc2 received remote stream');
  }

  const onIceCandidate = (pc: RTCPeerConnection, event: RTCPeerConnectionIceEvent) => {
    try {
      const otherPc = (pc === pc1) ? pc2 : pc1
      if (!otherPc) return;
      otherPc.addIceCandidate(event.candidate ?? undefined);
      if (otherPc === pc1) {
        setPc1(otherPc)
      } else {
        setPc2(otherPc);
      }
      onAddIceCandidateSuccess(pc);

    } catch (e) {
      onAddIceCandidateError(pc, e as Error);
    }
  }

  const onAddIceCandidateError =  (pc: RTCPeerConnection, e: Error) => {
    console.log(`${pc === pc1 ? 'pc1': 'pc2'} failed to add ICE Candidate: ${e.toString()}`);
  }

  const onAddIceCandidateSuccess = (pc: RTCPeerConnection) => {
    console.log(`${pc === pc1 ? 'pc1': 'pc2'} addIceCandidate success`)
  }

  const onIceStateChange = (pc: RTCPeerConnection, event: Event) => {
    if (!pc) return;
    console.log(`${pc === pc1 ? 'pc1': 'pc2'} ICE state: ${pc.iceConnectionState}`);
    console.log('ICE state change event: ', event);
  }

  return (
    <main>
      <div>
        <video style={{width: 640, height: 360}} ref={localVideo} autoPlay></video>
      </div>
      <div>
        <video style={{width: 640, height: 360, backgroundColor: "white"}} ref={remoteVideo} autoPlay></video>
      </div>
      <button style={{padding: 6, marginRight: 16, color: "burlywood"}} onClick={startStream}>Start</button>
      <button style={{padding: 6, marginRight: 16, color: "burlywood"}} onClick={joinStream}>Join Stream</button>
      <button style={{padding: 6, marginRight: 16, color: "burlywood"}} onClick={leaveStream}>Leave Stream</button>
    </main>
  )
}

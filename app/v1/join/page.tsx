"use client"
import { useEffect, useRef, useState } from "react"
import adapter from "webrtc-adapter";
import Pusher, { Channel } from 'pusher-js';

import { SignalingMessage, SignalingMessageType } from "@/types/signaling";


const pusher = new Pusher(
    process.env.NEXT_PUBLIC_PUSHER_APP_KEY ?? '', {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? '',
})

export default function V1() {
    const impolite = false;
    const [makingOffer, setMakingOffer] = useState(false);

    const username = useRef('creepywatcher');
    const signalingChannel = useRef<Channel | null>(null);
    const remoteVideo = useRef<HTMLVideoElement>(null);
    const connection = useRef<RTCPeerConnection | null>(null);

    const call = async function () {
        console.log('attempting to join');
        try {
            signalingChannel.current = await initSignalingChannel();

            const pc = initializeConnection();
            connection.current = pc;
        } catch (e) { console.error(e) }
    }

    const endStream = async function () {
        console.log('ending');
        if (connection.current) connection.current.close();
    }
    
    const sendMessage = async (message: SignalingMessage) => {
        return fetch('/api/signaling', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message)
        })
    }

    const initializeConnection = function () {
        const config: RTCConfiguration = {
            iceServers: [
                {
                    urls: [
                        // process.env.NEXT_PUBLIC_STUN_SERVER_1 ?? '',
                        process.env.NEXT_PUBLIC_STUN_SERVER_2 ?? '',
                    ]
                },
                {
                    urls: process.env.NEXT_PUBLIC_TURN_URL ?? '',
                    username: process.env.NEXT_PUBLIC_TURN_USERNAME,
                    credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL
                },
            ],
            iceCandidatePoolSize: 10,
        }

        const pc = new RTCPeerConnection(config);

        pc.onnegotiationneeded = async function () {
            if (!pc) return;
            try {
                setMakingOffer(true);
                await pc.setLocalDescription();
                await sendMessage({
                    roomCode: '1',
                    user: username.current,
                    type: SignalingMessageType.offer,
                    sdp: pc.localDescription
                });
            } catch (err) {
                console.error(err);
            } finally {
                setMakingOffer(false);
            }
        }

        pc.onicecandidate = async function (event) {
            console.log(event)
            try {
                await sendMessage({
                    roomCode: '1',
                    user: username.current,
                    type: SignalingMessageType.iceCandidate,
                    candidate: event.candidate,
                });
            } catch (err) { console.error(err) }
        }

        pc.onsignalingstatechange = function (event) {
            console.log('signaling state change: ', pc?.signalingState)
        }

        pc.oniceconnectionstatechange = function () {
            console.log(`ICE connection state change: ${pc?.iceConnectionState}`);
            if (pc && pc.iceConnectionState === 'failed') {
              console.error('ICE Connection Failed');
              // Notify the user about the failure
            }
        };

        pc.onicegatheringstatechange = async function () {
            // generate connection offer with agreed ice candidate
            if (pc && pc.iceGatheringState === 'complete') {
                console.log('sending real offer')
                // Send localDescription to the other peer using your signaling mechanism
                await sendMessage({
                    roomCode: '1',
                    type: SignalingMessageType.offer,
                    user: username.current,
                    sdp: pc.localDescription
                })
            }
         };

        pc.ontrack = function (event) {
            if (!remoteVideo.current) return;

            console.log('setting track', event);
            remoteVideo.current.srcObject = event.streams[0];

            // event.track.onunmute = () => {
            //     if (!remoteVideo.current) return;
            //     remoteVideo.current.srcObject = event.streams[0];
            // }
        }
    
        return pc;
    }

    const initSignalingChannel = async function () {
        let ignoreOffer = false;
        const signalingChannel = pusher.subscribe('signaling'); // should be the room code?

        signalingChannel.bind('client-message', async function (message: SignalingMessage) {
            console.log(message);
            try {
                if (!connection.current) return;
                // ignore messages from self
                if (message.user === username.current) return;

                switch (message.type) {
                    case SignalingMessageType.offer:
                        console.log('recieving offer');

                        // offer collision exists if making offer or non-stable connection
                        const offerCollision = makingOffer || connection.current.signalingState !== 'stable';
                        ignoreOffer = impolite && offerCollision;
                        if (ignoreOffer || !message.sdp) return;

                        console.log('init connection using agreed ice candidate')
                        await connection.current.setRemoteDescription(message.sdp);
                        try {
                            // generates "perfect condition" answer
                            await connection.current.setLocalDescription();
                            console.log('answer sdp', connection.current.localDescription);
                            await sendMessage({
                                roomCode: '1',
                                user: username.current,
                                type: SignalingMessageType.offer,
                                sdp: connection.current.localDescription
                            });
                        } catch (err) { console.log(err) }
                        break;
                    case SignalingMessageType.iceCandidate:
                        console.log('__iceCandidate');

                        // do nothing if still gathering ice candidates
                        if (connection.current.iceGatheringState !== 'complete') return;

                        try {
                            await connection.current.addIceCandidate(message.candidate ?? undefined);
                        } catch (err) {
                            if (!ignoreOffer) { throw err }
                        }
                        break;
                }
            } catch (err) {
                console.error('connection logic problem:')
                console.error(err)
            }
        })

        return signalingChannel;
    }

    useEffect(() => {
        return () => {
            if (!signalingChannel.current) return;

            console.log('cleaning up!');
            signalingChannel.current.unbind_all();
            signalingChannel.current.unsubscribe();
            pusher.disconnect();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <div style={{display: 'flex', marginLeft: 'auto', marginRight: 'auto', gap: '1rem'}}>
                <div style={{display: 'flex', flexDirection: 'column'}}>
                    <h2 style={{marginLeft: 'auto', marginRight: 'auto'}}>Local Stream</h2>
                    <video ref={remoteVideo} style={{ width: '100%', backgroundColor: '#615d5d', borderRadius: '2px'}} autoPlay></video>
                </div>
            </div>
            <div style={{display: 'flex', gap: '1rem', marginLeft: 'auto', marginRight: 'auto'}}>
                <button onClick={call} style={{padding: '.5rem 1rem .5rem 1rem', paddingLeft: '1rem', paddingRight: '1rem', borderRadius: 4}}>Join</button>
                <button onClick={endStream} style={{padding: '.5rem 1rem .5rem 1rem', paddingLeft: '1rem', paddingRight: '1rem', borderRadius: 4}}>End</button>
            </div>
        </div>
    );
}

// "use client"
// import { useEffect, useRef, useState } from "react"
// import adapter from "webrtc-adapter";
// import Pusher from 'pusher-js';

// import { SignalingMessage } from "@/types/signaling";


// const pusher = new Pusher(
//     process.env.NEXT_PUBLIC_PUSHER_APP_KEY ?? '', {
//     cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? '',
// })

// export default function V1() {
//     const [isFirstRender, setIsFirstRender] = useState(true);
//     const [connectionState, setConnectionState] = useState('');
//     const username = useRef('watcher');

//     const remoteVideo = useRef<HTMLVideoElement>(null);
//     const connection = useRef<RTCPeerConnection | null>(null);

//     const call = async function () {
//         const pc = initializeConnection();
//         connection.current = pc;
//     }

//     const hangup = async function () {
//         if (!connection.current) return;
//         connection.current.close();
//     }
    
//     const sendMessage = async (message: SignalingMessage) => {
//         return fetch('/api/signaling', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(message)
//         })
//     }

//     const handleOffer = async function (message: SignalingMessage) {
//         if (!connection.current) return;
//         if (!message.sdp) {
//             console.error('no SDP provided in offer message!')
//             return;
//         };
//         console.log('setting remote description')
//         await connection.current.setRemoteDescription(message.sdp);

//         console.log('creating answer')
//         const answer = await connection.current.createAnswer()

//         console.log('setting local description')
//         await connection.current.setLocalDescription(new RTCSessionDescription(answer))

//         console.log('sending answer message')
//         await sendMessage({
//             roomCode: '1',
//             type: 'answer',
//             user: username.current,
//             sdp: connection.current.localDescription
//         });
        
//     }

//     const initializeConnection = function () {
//         const configuration: RTCConfiguration = {
//             iceServers: [
//                 {
//                     urls: [
//                         // process.env.NEXT_PUBLIC_STUN_SERVER_1 ?? '',
//                         process.env.NEXT_PUBLIC_STUN_SERVER_2 ?? '',
//                     ]
//                 },
//                 {
//                     urls: process.env.NEXT_PUBLIC_TURN_URL ?? '',
//                     username: process.env.NEXT_PUBLIC_TURN_USERNAME,
//                     credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL
//                 },
//             ],
//             iceCandidatePoolSize: 10,
//         }
//         const pc = new RTCPeerConnection(configuration);

//         pc.onicecandidate = async function ({candidate}) {
//             if (candidate) {
//                 await sendMessage({
//                     roomCode: '1',
//                     type: 'new-ice-candidate',
//                     user: username.current,
//                     candidate: candidate
//                 })
//             }
//         }

//         pc.onnegotiationneeded = async function () {
//             try {
//                 if (!pc) return;
//                 const offer = await pc.createOffer();
//                 await pc.setLocalDescription(new RTCSessionDescription(offer));
//             } catch (err) {
//                 console.error(err);
//             }
//         }

//         pc.onsignalingstatechange = function (event) {
//             console.log('signaling state change: ', pc?.signalingState)
//         }

//         pc.oniceconnectionstatechange = function () {
//             console.log(`ICE connection state change: ${pc?.iceConnectionState}`);
//             setConnectionState(pc?.iceConnectionState);
//             if (pc && pc.iceConnectionState === 'failed') {
//               console.error('ICE Connection Failed');
//               // Notify the user about the failure
//             }
//         };

//         pc.onicegatheringstatechange = async function () {
//             if (pc && pc.iceGatheringState === 'complete') {
//                 const localDescription = pc.localDescription;
//                 // Send localDescription to the other peer using your signaling mechanism
//                 await sendMessage({
//                     roomCode: '1',
//                     type: 'offer',
//                     user: username.current,
//                     sdp: pc.localDescription
//                 })
//             }
//          };

//         pc.ontrack = function (event) {
//             if (!remoteVideo.current) return;
//             remoteVideo.current.srcObject = event.streams[0];
//         }
//         return pc;
//     }

//     useEffect(() => {
//         const signalingChannel = pusher.subscribe('signaling'); // should be the room code?
//         signalingChannel.bind('client-message', async function (message: SignalingMessage) {
//             if (message.user === username.current) return;
//             console.log(message.user, username.current);
//             console.log(message);
//             switch (message.type) {
//               case 'offer':
//                 console.log('__offer')
//                 await handleOffer(message)
//                 break;
//               case 'answer':
//                 console.log('__answer')
//                 if (!connection.current || connection.current.signalingState === 'stable') return;
//                 if (!message.sdp) {
//                     console.error('no SDP provided in answer message!')
//                     return;
//                 };
//                 await connection.current.setRemoteDescription(message.sdp);
//                 break;
//               case 'new-ice-candidate':
//                 console.log('__ice-candidate')
//                 if (!connection.current || !connection.current.remoteDescription) return;
//                 await connection.current.addIceCandidate(message.candidate);
//                 break;
//               default:
//                 console.error(`Unknown message type: ${message.type}`);
//             }
//         })

//         return () => {
//             if (isFirstRender) {
//                 setIsFirstRender(false);
//                 return;
//             }
//             console.log('cleaning up!');
//             signalingChannel.unbind_all();
//             signalingChannel.unsubscribe();
//             pusher.disconnect();
//         }
//     }, [])

//     return (
//         <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
//             <div style={{display: 'flex', marginLeft: 'auto', marginRight: 'auto', gap: '1rem'}}>
//                 <div style={{display: 'flex', flexDirection: 'column'}}>
//                     <h2>Remote Stream</h2>
//                     <video ref={remoteVideo} style={{ width: '960px', backgroundColor: 'grey'}} autoPlay></video>
//                 </div>
//             </div>
//             <div style={{display: 'flex', justifyContent: 'space-around'}}>
//                 <h2>{connectionState}</h2>
//             </div>
//             <div style={{display: 'flex', gap: '1rem', marginLeft: 'auto', marginRight: 'auto'}}>
//                 <button onClick={call} style={{padding: '.5rem 1rem .5rem 1rem', paddingLeft: '1rem', paddingRight: '1rem', borderRadius: 4}}>Join</button>
//                 <button onClick={hangup} style={{padding: '.5rem 1rem .5rem 1rem', paddingLeft: '1rem', paddingRight: '1rem', borderRadius: 4}}>Leave</button>
//             </div>
//         </div>
//     );
// }
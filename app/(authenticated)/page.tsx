"use client"
import { useEffect, useRef, useState } from "react"
import adapter from "webrtc-adapter";
import Pusher, { Channel } from 'pusher-js';

import { useRouter } from "next/navigation";
import { Box, Button, Divider, Input, Text } from "@chakra-ui/react";

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
      <Box display={'flex'} flexDir={'column'} textAlign={'center'} gap={8} h={'100%'}>
          <Text fontSize={'xl'}>Welcome to boppi!</Text>
          <Box p={8}>
            <Box display={'flex'} mx={'auto'} gap={8} w={'100%'}>
              <Box display={'flex'} flexDir={'column'} p={8} gap={4} w={'100%'} bgColor={'#212121'}>
                <Text fontSize={'xl'}>Want to start a stream?</Text>
                <Button size={'lg'} fontSize={'xl'} onClick={host}>Start a stream</Button>
              </Box>
              <Box display={'flex'} flexDir={'column'} p={8} gap={4} w={'100%'} bgColor={'#212121'}>
                <Text fontSize={'xl'}>Know your room code? Enter it here:</Text>
                <Input size={'lg'} fontSize={'xl'} type="text" placeholder="roomcode" onChange={(e) => setRoomCode(e.target.value)}/>
                <Button size={'lg'} fontSize={'xl'} onClick={goToRoom}>Go!</Button>
              </Box>
            </Box>
          </Box>
          <Divider />
      </Box>
  );
}
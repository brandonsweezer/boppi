"use client"
import { useEffect, useRef, useState } from "react"
import adapter from "webrtc-adapter";
import Pusher, { Channel } from 'pusher-js';

import { useRouter } from "next/navigation";
import { Box, Button, Divider, Input, Text } from "@chakra-ui/react";
import FriendSection from "./FriendSection";
import { User } from "@/types/user";
import { Message, MessageType } from "@/types/message";

export default function Home() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [user, setUser] = useState<User>();
  const [friendRequests, setFriendRequests] = useState<Message[]>([]);

  const goToRoom = () => {
    router.push(`/${roomCode}`)
  }

  const host = () => {
    router.push(`/host`)
  }

  const getUser = async () => {
    const res = await fetch('/api/users/me', {
      method: 'GET',
    })
    if (res.status === 200) {
      const user = await res.json();
      setUser(user);
    }
  }

  const getFriendRequests = async () => {
    const res = await fetch('/api/users/me/friendRequests', {
      method: 'GET',
    })
    if (res.status === 200) {
      const friendRequests = await res.json();
      setFriendRequests(friendRequests);
    }
  }

  useEffect(() => {
    getUser();
    getFriendRequests();
  }, [])
  
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
          {user && <FriendSection user={user} friendRequests={friendRequests} />}
      </Box>
  );
}
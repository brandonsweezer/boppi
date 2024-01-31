'use client'
import { Box, Button, Divider, Heading, Input, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState } from "react"

export default function SignUp() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const login = async () => {
        const result = await fetch('/api/auth/signup', {
            method: 'POST',
            cache: 'no-cache',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                username,
                password
            })
        })
        console.log(result);
    }

    return (
        <Box display={'flex'} flexDir={'column'} p={4} gap={4} maxWidth={'50%'} ml={'auto'} mr={'auto'}>
            <Heading textAlign={'center'}>Create Account</Heading>
            <Box display={'flex'} flexDirection={'column'} gap={2}>
                <Text>Email:</Text>
                <Input type="text" placeholder="email" onChange={(e) => setUsername(e.target.value)}/>
                <Text>Password:</Text>
                <Input type="password" placeholder="password" onChange={(e) => setPassword(e.target.value)}/>
                <Button onClick={login}>Sign Up</Button>
            </Box>
            <Divider />
            <Box display={'flex'} flexDirection={'column'} gap={2}>
                <Text textAlign={'center'}>Or</Text>
                <Button onClick={() => router.replace('login')}>Log In</Button>
            </Box>
        </Box>
    )
}
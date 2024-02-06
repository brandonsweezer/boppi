'use client'
import { Box, Button, Divider, Heading, Input, Spinner, Text } from "@chakra-ui/react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react"

export default function SignUp() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const signup = async () => {
        setLoading(true);
        setError('');
        fetch('/api/auth/signup', {
            method: 'POST',
            cache: 'no-cache',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                email,
                password
            })
        }).then((res) => {
            setLoading(false);
            if (res.status === 200) {
                router.replace('/');
            } else if (res.status === 409) {
                setError('User already exists!');
            } else if (res.status === 400) {
                setError('Please check that email and password are correct.')
            } else {
                setError('Something went wrong.')
            }
        })
    }

    useEffect(() => {
        Cookies.remove('token');
        Cookies.remove('email');
    }, []);

    return (
        <Box display={'flex'} flexDir={'column'} p={4} gap={4} maxWidth={'50%'} ml={'auto'} mr={'auto'}>
            <Heading textAlign={'center'}>Create Account</Heading>
            <Box display={'flex'} flexDirection={'column'} gap={2}>
                <Text>Email:</Text>
                <Input type="text" placeholder="email" onChange={(e) => setEmail(e.target.value)}/>
                <Text>Password:</Text>
                <Input type="password" placeholder="password" onChange={(e) => setPassword(e.target.value)}/>
                <Button onClick={signup}>Sign Up</Button>
                {loading && <Spinner textAlign={'center'} />}
                {error && <Text color={'red'}>{error}</Text>}
            </Box>
            <Divider />
            <Box display={'flex'} flexDirection={'column'} gap={2}>
                <Text textAlign={'center'}>Or</Text>
                <Button onClick={() => router.replace('login')}>Log In</Button>
            </Box>
        </Box>
    )
}
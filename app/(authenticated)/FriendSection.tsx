import { Message } from "@/types/message";
import { User } from "@/types/user";
import { AddIcon } from "@chakra-ui/icons";
import { Box, Button, Divider, HStack, IconButton, Input, List, ListItem, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";

export default function FriendSection({ user, friendRequests }: { user: User, friendRequests: Message[] }) {
    const [toId, setToId] = useState<string>('');
    const [sendingRequest, setSendingRequest] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean | undefined>();
    
    const [handling, setHandling] = useState<boolean>(false);
    const [handlingSuccess, setHandlingSuccess] = useState<boolean>(false);

    const handleFriendRequest = async (requestId: string, accept: boolean) => {
        setHandling(true);
        const res = await fetch(`/api/friends/requests/${requestId}`, {
            method: 'POST',
            body: JSON.stringify({ accept })
        })
        setHandling(false);
        if (res.status === 200) {
            setHandlingSuccess(true);
        }
    }

    const sendFriendRequest = async () => {
        setSendingRequest(true);
        const res = await fetch('/api/friends/add', {
            method: 'POST',
            body: JSON.stringify({
                fromId: user._id,
                toId: toId,
                content: `${user.email} added you as a friend`
            })
        })
        setSendingRequest(false);
        if (res.status === 201) {
            setSuccess(true);
        }
    }

    return (
        <Box backgroundColor={'#212121'} mx={8} display={'flex'} flexDirection={'column'} justifyContent={'space-evenly'} gap={4} py={8}>
            <List>
                {friendRequests.map((request) => {
                    return (
                        <ListItem key={request._id} textAlign={'center'} display={'flex'} gap={2} p={4}>
                            <Text>
                                {request.content}
                            </Text>
                            <Button isLoading={handling} onClick={() => handleFriendRequest(request._id, true)}>Accept</Button>
                            <Button isLoading={handling} onClick={() => handleFriendRequest(request._id, false)}>Decline</Button>
                        </ListItem>
                    )
                })}
            </List>
            <Divider />
            <Box display={'flex'} gap={2} p={4}>
                <VStack gap={4} width={'100%'}>
                    <Text >Your FriendID:</Text>
                    <Text fontSize={'xl'}>{user._id}</Text>
                </VStack>
                <VStack width={'100%'}>
                    <Text>Add Friend</Text>
                    <HStack width={'100%'} gap={2}>
                        <Input onChange={(e) => {
                                setSuccess(undefined);
                                setToId(e.target.value)
                            }} size={'lg'} placeholder="Friend ID" />
                        <IconButton isLoading={sendingRequest} onClick={sendFriendRequest} size={'lg'} aria-label="add friend" icon={<AddIcon />}/>
                    </HStack>
                </VStack>
            </Box>
            <Divider />
            <List textAlign={'left'} px={4}>
                <Text fontSize={'lg'}>Friends</Text>
                {!user.friendIds && <Text>{"No friends :-("}</Text>}
                {user.friendIds?.map((friend) => {
                    return (
                        <ListItem key={friend.id}>
                            <Text fontSize={'lg'}>
                                {friend.name} - {friend.id}
                            </Text>
                        </ListItem>
                    )
                })}
            </List>
        </Box>
    )
}
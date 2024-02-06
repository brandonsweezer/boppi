'use client'
import { Box, Button, Collapse, IconButton, List } from "@chakra-ui/react";
import { CloseIcon, HamburgerIcon } from "@chakra-ui/icons";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Sidebar() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    return (
        <Box display={'flex'} flexDir={'column'} p={2} gap={2}> 
            <IconButton width={'100%'}
                aria-label="Open menu"
                icon={open ? <CloseIcon /> : <HamburgerIcon />}
                onClick={() => setOpen(!open)}
            />
            <Collapse in={open} rev="true">
                <List display={'flex'} flexDir={'column'} gap={'2'}>
                    <Button onClick={() => router.replace('/')}>Home</Button>
                    <Button onClick={() => router.replace('logout')}>Logout</Button>
                </List>
            </Collapse>
        </Box>
    )
}
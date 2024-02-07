import { Box, Button, Divider, Text } from "@chakra-ui/react";
import Sidebar from "./Sidebar";


export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Box display={'flex'} height={'100%'} overflow={'hidden'}>
            <Sidebar />
            <Divider orientation="vertical"/>
            <Box width={'100%'}>
                {children}
            </Box>
        </Box>
    );
}

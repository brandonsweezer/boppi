// app/providers.tsx
'use client'


import { ChakraProvider, extendTheme } from '@chakra-ui/react'


const config = {
    useSystemColorMode: true,
    initialColorMode: "dark",
  }
  // 3. extend the theme
const customTheme = extendTheme({ config })
  
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider theme={customTheme}>
        {children}
    </ChakraProvider>
    )
}
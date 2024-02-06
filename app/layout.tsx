import { Providers } from "./providers"

export const metadata = {
  title: 'boppi.tv',
  description: 'Stream low latency video',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" style={{height: '100%', padding: 0, margin: 0}}>
      <body style={{height: '100%', padding: 0, margin: 0}}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

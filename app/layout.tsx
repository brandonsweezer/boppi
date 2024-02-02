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
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

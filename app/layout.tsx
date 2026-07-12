
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chat Brasil',
  description: 'Seu chat online',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body>{children}</body>
    </html>
  )
}

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = { title: 'GeoPuzzle — Play. Explore. Learn.', description: 'A beautiful geography puzzle game.' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}

import type { Metadata } from 'next'
import { ClerkProvider, Show, UserButton, SignInButton, SignUpButton } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'CutLike — Edit like your inspiration',
  description: 'Upload raw footage, drop an inspiration link, get a professional edit in minutes.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
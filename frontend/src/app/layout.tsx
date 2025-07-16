import './globals.css'
import { Providers } from './providers'
import { Navigation } from '@/components/layout'

export const metadata = {
  title: 'DevIT - Developer Platform',
  description: 'A modern GitHub alternative built for developers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-gray-50 dark:bg-gray-900">
        <Providers>
          <div className="flex h-full flex-col">
            <Navigation />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}

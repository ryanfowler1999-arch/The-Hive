import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'The Hive Mind | Think Like the Hive', description: 'A daily consensus guessing game. Can you think like everyone else and reach the queen?' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html> }

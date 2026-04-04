import './globals.css'

export const metadata = {
  title: 'KINETIC — Bulk AI Content Engine',
  description: 'Bulk AI product lifestyle staging engine',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#0e0e13" />
      </head>
      <body>{children}</body>
    </html>
  )
}

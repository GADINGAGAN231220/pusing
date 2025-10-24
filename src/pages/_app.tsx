import '../styles/globals.css' // Pastikan Anda punya file CSS global
import type { AppProps } from 'next/app'

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

export default MyApp
import type { AppProps } from 'next/app';
import { Session } from 'next-auth';
import { SessionProvider } from "next-auth/react";
import ErrorBoundary from "../components/ErrorBoundary";
import "../styles/globals.css";

interface MyAppProps extends AppProps {
  pageProps: {
    session?: Session | null;
  } & AppProps['pageProps']
}

function MyApp({ Component, pageProps: { session, ...pageProps } }: MyAppProps) {
  return (
    <SessionProvider session={session}>
      <ErrorBoundary
        fallbackText="Something went wrong with the application"
        fallbackDescription="Please try refreshing the page or sign out and sign back in."
        showError={process.env.NODE_ENV === 'development'}
      >
        <Component {...pageProps} />
      </ErrorBoundary>
    </SessionProvider>
  );
}

export default MyApp;

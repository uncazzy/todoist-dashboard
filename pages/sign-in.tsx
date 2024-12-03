import React from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import type { NextPage } from 'next';

const SignIn: NextPage = () => {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  React.useEffect(() => {
    // If we have an error, log it
    if (router.query.error) {
      console.error('Auth error:', router.query.error);
      setIsLoading(false);
    }
    // If we have a code but no session, try signing in
    if (router.query.code && !session && !isLoading) {
      console.log('Got code, attempting sign in...');
      handleSignIn();
    }
  }, [router.query, session, isLoading]);

  const handleSignIn = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await signIn("todoist", {
        redirect: false,
        callbackUrl: "/",
      });
      console.log('Sign in result:', result);
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  };

  // Show loading state while checking session
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '80vh',
      gap: '20px'
    }}>
      {router.query.error && (
        <div style={{ color: 'red' }}>
          Authentication error: {router.query.error}
        </div>
      )}
      <button
        onClick={handleSignIn}
        disabled={isLoading}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#e44332',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading ? 'default' : 'pointer',
          opacity: isLoading ? 0.7 : 1
        }}
      >
        {isLoading ? "Loading..." : "Sign in with Todoist"}
      </button>
    </div>
  );
};

export default SignIn;

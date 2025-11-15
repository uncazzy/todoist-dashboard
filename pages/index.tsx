import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import type { NextPage } from 'next';
import Dashboard from "../components/Dashboard";

const Home: NextPage = () => {
  const { data: session } = useSession();
  const router = useRouter();

  React.useEffect(() => {
    if (!session) {
      router.push('/sign-in');
    }
  }, [session, router]);

  if (!session) {
    return null;
  }

  return (
    <main>
      <Dashboard />
    </main>
  );
};

export default Home;

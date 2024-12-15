import React from "react";
import { useSession } from "next-auth/react";
import type { NextPage } from 'next';
import Dashboard from "../components/Dashboard";
import SignIn from "./sign-in";

const Home: NextPage = () => {
  const { data: session } = useSession();

  return (
    <main>
      {!session ? (
        <SignIn />
      ) : (
        <Dashboard />
      )}
    </main>
  );
};

export default Home;

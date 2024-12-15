import React from "react";
import { useSession } from "next-auth/react";
import type { NextPage } from 'next';
import Layout from "../components/layout/Layout";
import Dashboard from "../components/Dashboard";
import SignIn, { metadata as signInMetadata } from "./sign-in";

const Home: NextPage = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-xl">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout {...(!session ? signInMetadata : { title: "Dashboard | Todoist Dashboard", description: "View your Todoist analytics and insights" })}>
      <main>
        {!session ? (
          <SignIn />
        ) : (
          <Dashboard />
        )}
      </main>
    </Layout>
  );
};

export default Home;

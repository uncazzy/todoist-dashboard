import React from "react";
import Head from "next/head";
import { useSession } from "next-auth/react";
import type { NextPage } from 'next';
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Dashboard from "../components/Dashboard";
import SignIn from "./sign-in";

const Home: NextPage = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-2 min-h-screen">
        <Head>
          <title>Todoist Dashboard</title>
          <meta
            name="description"
            content="Advanced reports for your Todoist tasks"
          />
          <link
            rel="icon"
            href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📊</text></svg>"
          />
        </Head>

        {session && <Header user={session?.user} />}

        <main>
          {!session ? (
            <SignIn />
          ) : (
            <Dashboard />
          )}
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Home;

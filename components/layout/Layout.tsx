import React from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = "Todoist Dashboard",
  description = "Advanced reports for your Todoist tasks"
}) => {
  const { data: session } = useSession();

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta
          name="description"
          content={description}
        />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📊</text></svg>"
        />
      </Head>
      <div className="min-h-screen flex flex-col text-white">
        <Header user={session?.user || null} />
        <main className="flex-1 container mx-auto px-4 pb-8">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Layout;

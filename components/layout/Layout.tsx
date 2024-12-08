import React from 'react';
import { useSession } from 'next-auth/react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { data: session } = useSession();

  return (
    <div className="container mx-auto px-4 min-h-screen text-white">
      <Header user={session?.user || null} />
      <main className="pb-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;

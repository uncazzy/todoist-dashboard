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
    <div className="min-h-screen bg-gray-900 text-white">
      <Header user={session?.user || null} />
      <main className="pb-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;

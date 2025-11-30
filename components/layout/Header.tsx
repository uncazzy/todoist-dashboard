import React from "react";
import { signOut } from "next-auth/react";
import type { DefaultSession } from "next-auth";
import { trackNavigation } from "@/utils/analytics";

interface HeaderProps {
  user: DefaultSession["user"] | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const handleSignOut = () => {
    trackNavigation('sign_out');
    signOut();
  };

  return (
    <div className="border-b border-warm-border bg-warm-black">
      <div className="container mx-auto flex justify-end items-center py-4 px-6">
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-warm-gray">{user.email}</span>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm text-white bg-warm-peach rounded-xl hover:opacity-90 transition-opacity font-medium"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;

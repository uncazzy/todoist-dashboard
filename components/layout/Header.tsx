import React from "react";
import { signOut } from "next-auth/react";
import type { DefaultSession } from "next-auth";

interface HeaderProps {
  user: DefaultSession["user"] | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <div className="container mx-auto flex justify-end py-8 px-4">
      <nav>
        <section className="flex justify-end items-center">
          <div className="flex items-center gap-4">
            {user && (
              <>
                <span className="text-gray-700">{user.email}</span>
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 text-sm text-white bg-red-500 rounded hover:bg-red-600"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </section>
      </nav>
    </div>
  );
};

export default Header;

import React from "react";
import Link from "next/link";
import { CiCoffeeCup } from "react-icons/ci";
import { MdFeedback } from "react-icons/md";
import { FaXTwitter } from "react-icons/fa6";
import VersionInfo from "../shared/VersionInfo";

const Footer: React.FC = () => {
  return (
    <footer className="py-4">
      <div className="flex flex-col items-center justify-center">
        <p className="text-sm text-gray-500 pb-0">
          &copy; {new Date().getFullYear()} Todoist Dashboard{' '}
          <Link href="/legal" className="hover:text-gray-400">Legal & About</Link>
          {' · '}<VersionInfo />
        </p>
        <div className="flex items-center gap-4 mt-2">          
          <a href="mailto:todoist-dashboard@azzy.cloud?subject=Todoist%20Dashboard%20Feedback" target="_blank" rel="noopener noreferrer" title="Provide feedback, suggestions, or bug reports" className="text-gray-500 hover:text-gray-400">
            <MdFeedback className="text-xl" />
          </a>
          <a href="https://x.com/uncazzy" target="_blank" rel="noopener noreferrer" title="Follow on X (Twitter)" className="text-gray-500 hover:text-gray-400">
            <FaXTwitter className="text-lg" />
          </a>
          <a href="https://buymeacoffee.com/azurd" target="_blank" rel="noopener noreferrer" title="Buy me a coffee" className="text-gray-500 hover:text-gray-400">
            <CiCoffeeCup className="text-xl" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

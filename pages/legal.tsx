import React from 'react';
import Head from "next/head";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { IoArrowBack } from "react-icons/io5";
import { useRouter } from 'next/router';
import { useSession } from "next-auth/react";
import type { NextPage } from 'next';

const Legal: NextPage = () => {
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <>
      <div className="container mx-auto px-4 min-h-screen">
        <Head>
          <title>Legal & About - Todoist Dashboard</title>
          <meta
            name="description"
            content="Privacy policy and information about Todoist Dashboard"
          />
          <link
            rel="icon"
            href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📊</text></svg>"
          />
        </Head>

        <Header user={session?.user} />

        <div className="max-w-3xl mx-auto py-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-500 hover:text-gray-700 mb-6 transition-colors"
          >
            <IoArrowBack className="mr-1" />
            Back
          </button>
          <h1 className="text-2xl font-bold mb-0">About & Legal Information</h1>
          <span className="text-sm text-gray-400">Last updated: 11/30/2024</span>

          <section className="my-12">
            <h2 className="text-xl font-semibold mb-4">About Todoist Dashboard</h2>
            <p className="mb-4">
              I created Todoist Dashboard as a free, open-source tool to provide visual analytics and insights for Todoist tasks.
              My goal is to help you understand your productivity patterns and task completion trends through interactive charts and statistics.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Privacy Policy</h2>
            <div className="space-y-4">
              <p>
                I take your privacy seriously. Here&apos;s how your data is handled:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Data Access with Permission:</strong> Todoist Dashboard accesses your Todoist data only with your explicit permission through OAuth authentication.
                </li>
                <li>
                  <strong>Server-Side Data Processing:</strong> The application fetches and processes your Todoist data on the server to provide dashboard functionalities, such as generating visual analytics and insights.
                </li>
                <li>
                  <strong>Data Security:</strong> Your Todoist access token is securely stored on the server and is not exposed to the client or any third parties. All communication between your browser and the server is encrypted via HTTPS.
                </li>
                <li>
                  <strong>No Data Retention:</strong> I do not store your personal data or task information beyond the active session required to provide the service. Data is processed in memory and not saved to any database or persistent storage.
                </li>
                <li>
                  <strong>No Third-Party Tracking:</strong> No third-party integrations or tracking technologies are used. The only cookies used are those essential for secure authentication and session management.
                </li>
                <li>
                  <strong>Open Source Transparency:</strong> Todoist Dashboard is an open-source project; its codebase is publicly available for transparency and trust.
                </li>
              </ul>
            </div>
          </section>

          {/* Terms of Use Section */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Terms of Use</h2>
            <div className="space-y-4">
              <p>By using Todoist Dashboard, you agree to the following terms:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  The service is provided &quot;as is&quot; without any warranties, express or implied, including suitability for a specific purpose or non-infringement.
                </li>
                <li>
                  Todoist Dashboard is a personal, open-source project and isn&apos;t affiliated with, sponsored by, or endorsed by Todoist or Doist.
                </li>
                <li>
                  I reserve the right to modify, suspend, or discontinue the service at any time without prior notice.
                </li>
                <li>
                  You are responsible for using Todoist Dashboard securely. The app handles your Todoist access token automatically on the server side; no action is required from you. However, avoid sharing access to your device or browser with untrusted parties.
                </li>
                <li>
                  By using Todoist Dashboard, you agree to comply with Doist&apos;s{' '}
                  <a
                    href="https://doist.com/terms-of-service"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600"
                  >
                    terms of service
                  </a>{' '}
                  and applicable laws while accessing and using their API through this tool.
                </li>
                <li>
                  I may update these terms of use and privacy policy from time to time. Any changes will be effective immediately upon posting. It is your responsibility to review these terms periodically for any updates.
                </li>
              </ul>
            </div>
          </section>

          {/* License Section */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">License</h2>
            <p className="mb-4">
              Todoist Dashboard is released under the MIT License. You are free to use, modify, and distribute this software in accordance with the terms of the license.
            </p>
            <p className="mb-4">
              <a
                href="https://github.com/uncazzy/todoist-dashboard/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600"
              >
                View the full MIT License
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Contact</h2>
            <p>
              If you have any questions, feedback, or concerns about this privacy policy or the service, feel free to{' '}
              <a
                href="mailto:todoist-dashboard@azzy.cloud"
                className="text-blue-500 hover:text-blue-600"
              >
                contact me
              </a>.
            </p>
          </section>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default Legal;

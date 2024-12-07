import React from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import type { NextPage } from 'next';
import { FaChartLine, FaRegClock, FaProjectDiagram, FaCheckCircle } from 'react-icons/fa';
import { BiTrendingUp } from 'react-icons/bi';

const FeatureCard = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
  <div className="flex items-start space-x-3 p-3">
    <div className="flex-shrink-0">
      <Icon className="h-5 w-5 text-blue-400 mt-1" />
    </div>
    <div>
      <h3 className="font-medium text-white my-0">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  </div>
);

const SignIn: NextPage = () => {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  React.useEffect(() => {
    if (router.query.error) {
      console.error('Auth error:', router.query.error);
      setIsLoading(false);
    }
    if (router.query.code && !session && !isLoading) {
      console.log('Got code, attempting sign in...');
      handleSignIn();
    }
  }, [router.query, session, isLoading]);

  const handleSignIn = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await signIn("todoist", {
        redirect: false,
        callbackUrl: "/",
      });
      console.log('Sign in result:', result);
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="max-h-fit flex bg-gray-900 rounded-xl">
      {/* Left side - Features */}
      <div className="hidden md:flex md:w-1/2 bg-gray-900 p-12 flex-col justify-between border-r border-gray-800">
        <div>
          <div className="mb-12">
            <h1 className="text-2xl font-bold text-white mb-3">
              Todoist Dashboard
            </h1>
            <p className="text-gray-400 leading-relaxed">
              Transform your Todoist experience with powerful analytics and insights. Track your productivity, visualize patterns, and optimize your task management workflow.
            </p>
          </div>
          
          <div className="space-y-3">
            <FeatureCard
              icon={FaChartLine}
              title="Task Analytics"
              description="Visualize completion patterns and track your progress over time with beautiful, interactive charts"
            />
            <FeatureCard
              icon={BiTrendingUp}
              title="Productivity Scoring"
              description="Get personalized daily scores based on your task completion and work habits"
            />
            <FeatureCard
              icon={FaRegClock}
              title="Time Insights"
              description="Discover your peak productivity hours and optimize your daily schedule for maximum efficiency"
            />
            <FeatureCard
              icon={FaProjectDiagram}
              title="Project Distribution"
              description="Understand how your time and effort are distributed across different projects and areas"
            />
            <FeatureCard
              icon={FaCheckCircle}
              title="Goal Tracking"
              description="Set and monitor progress towards your completion targets with detailed metrics"
            />
          </div>
        </div>
      </div>

      {/* Right side - Sign in */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Sign in with your Todoist account to continue
            </p>
          </div>

          <button
            onClick={() => !isLoading && handleSignIn()}
            disabled={isLoading}
            className="w-full flex justify-center items-center px-4 py-3 rounded-lg bg-[#e44332] text-sm font-medium text-white hover:bg-[#d13b2b] focus:outline-none focus:ring-2 focus:ring-[#e44332] focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Connecting...
              </div>
            ) : (
              'Continue with Todoist'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignIn;

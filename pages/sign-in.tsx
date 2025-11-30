import React from "react";
import { signIn, useSession, getSession } from "next-auth/react";
import { useRouter } from "next/router";
import type { NextPage, GetServerSideProps } from 'next';
import { FaChartLine, FaRegClock, FaProjectDiagram, FaCheckCircle } from 'react-icons/fa';
import { BiTrendingUp } from 'react-icons/bi';
import Layout from "@/components/layout/Layout";
import { trackNavigation } from "@/utils/analytics";

export const metadata = {
  title: "Sign In | Todoist Dashboard",
  description: "Sign in with your Todoist account to continue"
};

const FeatureCard = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
  <div className="flex items-start space-x-3 p-3">
    <div className="flex-shrink-0">
      <Icon className="h-5 w-5 text-warm-peach mt-1" />
    </div>
    <div>
      <h3 className="font-medium text-white my-0">{title}</h3>
      <p className="text-warm-gray">{description}</p>
    </div>
  </div>
);

export const getServerSideProps: GetServerSideProps = async (context: any) => {
  const session = await getSession(context);
  
  if (session) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

const SignIn: NextPage = () => {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const router = useRouter();
  const { data: session } = useSession();

  React.useEffect(() => {
    if (session) {
      router.replace('/');
    } else if (router.query.error) {
      console.error('Auth error:', router.query.error);
      setIsLoading(false);
    } else if (router.query.code && !isLoading) {
      handleSignIn();
    }
  }, [router, session, isLoading]);

  const handleSignIn = async (): Promise<void> => {
    setIsLoading(true);
    trackNavigation('sign_in');
    try {
      const result = await signIn("todoist", {
        redirect: false,
        callbackUrl: "/",
      });
      if (result?.error) {
        // Handle sign-in error
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  };

  return (
    <Layout title={metadata.title} description={metadata.description}>
      <div className="container mx-auto max-h-fit flex flex-col md:flex-row mt-6 mb-12">
        {/* Right side - Sign in */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-12 bg-warm-card my-6 sm:my-0 sm:order-2 rounded-e-xl sm:border-s border-warm-border">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">
                Welcome Back
              </h2>
              <p className="mt-2 text-sm text-warm-gray">
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

        {/* Left side - Features */}
        <div className="w-full md:w-1/2 bg-warm-card p-12 flex-col justify-between">
          <div>
            <div className="mb-12">
              <h1 className="text-2xl font-bold text-white mb-3">
                Todoist Dashboard
              </h1>
              <p className="text-warm-gray leading-relaxed">
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
                title="Recurring Tasks"
                description="Track completion rates, trends, and streaks of your recurring tasks and habits"
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SignIn;
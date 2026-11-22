import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { HiX } from 'react-icons/hi';
import { trackEvent } from '@/utils/analytics';
import dumplingLogo from '../public/dumpling-logo.png';

const DISMISS_KEY = 'dumpling-banner-dismissed-v1';

// UTM tags let the Dumpling site's analytics attribute these visits to this banner.
const DUMPLING_URL =
  'https://getdumpling.app/?utm_source=todoist-dashboard&utm_medium=banner&utm_campaign=todoist-import';

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    // Storage blocked (private mode, site data off): show the banner.
    return false;
  }
}

function saveDismissed(): void {
  try {
    window.localStorage.setItem(DISMISS_KEY, '1');
  } catch {
    // Storage blocked: the banner hides for this visit only.
  }
}

export default function DumplingBanner(): JSX.Element {
  const [visible, setVisible] = useState(false);
  const reduceMotion = useReducedMotion();

  // Read storage after mount so the server render and first client render match.
  useEffect(() => {
    setVisible(!readDismissed());
  }, []);

  const dismiss = () => {
    saveDismissed();
    setVisible(false);
    trackEvent('promo_dumpling_dismiss', {});
  };

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.aside
          aria-label="About Dumpling"
          initial={reduceMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 sm:py-3 sm:pr-3 sm:pl-5 bg-warm-card border border-warm-border rounded-2xl"
        >
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <Image src={dumplingLogo} alt="" width={44} height={44} className="w-11 h-11 flex-none" />
            <p className="flex-1 min-w-0 text-[15px] leading-normal text-warm-gray">
              <strong className="font-semibold text-white">I built a new app called Dumpling.</strong>{' '}
              Tasks, notes, calendar, habits and goals in one place, and it can import your Todoist
              projects and tasks, completed history included.
            </p>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss"
              className="sm:hidden -mt-2.5 -mr-2.5 w-11 h-11 flex-none inline-flex items-center justify-center rounded-xl text-warm-gray hover:text-white hover:bg-warm-hover transition-colors duration-200"
            >
              <HiX className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <a
              href={DUMPLING_URL}
              target="_blank"
              rel="noopener"
              onClick={() => trackEvent('promo_dumpling_click', {})}
              className="flex-1 sm:flex-none inline-flex items-center justify-center min-h-[44px] px-4 bg-warm-hover border border-warm-border rounded-xl text-sm font-medium text-white hover:border-warm-peach transition-colors duration-200"
            >
              Take a look
            </a>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss"
              className="hidden sm:inline-flex w-11 h-11 items-center justify-center rounded-xl text-warm-gray hover:text-white hover:bg-warm-hover transition-colors duration-200"
            >
              <HiX className="w-4 h-4" />
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, X, Sparkles } from 'lucide-react';
import { useProfileStore } from '@/lib/stores/profileStore';

interface DemoModeProps {
  className?: string;
}

export function DemoMode({ className }: DemoModeProps) {
  const router = useRouter();
  const [showBanner, setShowBanner] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { profile, getCompleteness } = useProfileStore();
  
  const completeness = getCompleteness();
  const hasProfile = completeness.overall > 0;

  useEffect(() => {
    // Check if user has dismissed the banner in this session
    const dismissed = sessionStorage.getItem('demo-mode-dismissed');
    if (!dismissed && !hasProfile) {
      setShowBanner(true);
    }
  }, [hasProfile]);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('demo-mode-dismissed', 'true');
    setShowBanner(false);
  };

  const handleSetupProfile = () => {
    router.push('/onboarding');
  };

  const handleContinueDemo = () => {
    handleDismiss();
  };

  if (!showBanner || isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={className}
      >
        <Alert className="relative bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="pr-8">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <p className="font-semibold text-gray-900 mb-1">
                  🎯 Demo Mode: Using sample company data
                </p>
                <p className="text-sm text-gray-600">
                  Complete your profile for accurate analysis and personalized RFP matching.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleContinueDemo}
                  className="bg-white"
                >
                  Continue Demo
                </Button>
                <Button
                  size="sm"
                  onClick={handleSetupProfile}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Set Up Real Profile
                </Button>
              </div>
            </div>
          </AlertDescription>
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
}

export function DemoModeIndicator() {
  const { getCompleteness } = useProfileStore();
  const completeness = getCompleteness();
  const hasProfile = completeness.overall > 0;

  if (hasProfile) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full"
    >
      <Sparkles className="h-3 w-3" />
      Demo Mode
    </motion.div>
  );
}
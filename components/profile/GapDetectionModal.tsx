'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { useProfileStore } from '@/lib/stores/profileStore';
import { ProfileSection } from '@/lib/types/profile';

interface GapDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingField: {
    section: ProfileSection;
    field: string;
    label: string;
    description?: string;
    currentValue?: any;
    requiredValue?: any;
  } | null;
  onUpdate: (section: ProfileSection, field: string, value: any) => void;
}

export function GapDetectionModal({
  isOpen,
  onClose,
  missingField,
  onUpdate,
}: GapDetectionModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showImpact, setShowImpact] = useState(false);
  const { getCompleteness, checkRequirement } = useProfileStore();
  
  // Calculate potential impact
  const currentCompleteness = getCompleteness().overall;
  const estimatedImpact = missingField ? Math.round(100 / Object.keys(getCompleteness().sections).length / 10) : 0;
  const newCompleteness = Math.min(100, currentCompleteness + estimatedImpact);

  useEffect(() => {
    if (isOpen) {
      setShowImpact(false);
      setIsUpdating(false);
    }
  }, [isOpen]);

  const handleResponse = async (hasCapability: boolean) => {
    if (!missingField) return;
    
    setIsUpdating(true);
    setShowImpact(true);
    
    // Simulate update delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onUpdate(missingField.section, missingField.field, hasCapability);
    
    // Show impact for a moment before closing
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleSkip = () => {
    onClose();
  };

  if (!missingField) return null;

  // Format the field name for display
  const formatFieldName = (field: string) => {
    // Handle nested fields
    if (field.includes('.')) {
      const parts = field.split('.');
      return parts.map(part => 
        part.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
      ).join(' - ');
    }
    
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const getFieldDescription = () => {
    if (missingField.description) return missingField.description;
    
    // Provide context-specific descriptions
    const descriptions: Record<string, string> = {
      'generalLiability.amount': 'Most RFPs require at least $1M in general liability coverage',
      'workersComp.hasIt': 'Workers compensation insurance is required for most commercial contracts',
      'hotWater.capable': 'Hot water pressure washing is essential for grease and oil removal',
      'samRegistration': 'SAM.gov registration is required for all federal contracts',
      'prevailingWage': 'Prevailing wage certification allows you to bid on government projects',
      'emergency247': '24/7 emergency service capability opens up high-value contracts',
    };
    
    const key = missingField.field.includes('.') 
      ? missingField.field 
      : `${missingField.section}.${missingField.field}`;
      
    return descriptions[missingField.field] || descriptions[key] || null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md" onClose={onClose}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            Profile Gap Detected
          </DialogTitle>
          <DialogDescription>
            This RFP requires information that's missing from your profile
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="font-medium text-blue-900 mb-1">
              {missingField.label || formatFieldName(missingField.field)}
            </p>
            {getFieldDescription() && (
              <p className="text-sm text-blue-700">
                {getFieldDescription()}
              </p>
            )}
          </div>

          <div className="text-center py-2">
            <p className="text-lg font-medium">
              Do you have this capability?
            </p>
          </div>

          <AnimatePresence>
            {showImpact && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-green-50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-900">Profile Impact</span>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current Match Score</span>
                    <span>{Math.round(currentCompleteness)}%</span>
                  </div>
                  <Progress value={currentCompleteness} className="h-2" />
                  <div className="flex justify-between text-sm font-medium text-green-600">
                    <span>New Match Score</span>
                    <span>{Math.round(newCompleteness)}% (+{estimatedImpact}%)</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isUpdating}
          >
            Skip for Now
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => handleResponse(false)}
              disabled={isUpdating}
              className="min-w-[80px]"
            >
              {isUpdating ? (
                <span className="flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  Saving...
                </span>
              ) : (
                'No'
              )}
            </Button>
            
            <Button
              onClick={() => handleResponse(true)}
              disabled={isUpdating}
              className="min-w-[80px]"
            >
              {isUpdating ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Saving...
                </span>
              ) : (
                'Yes'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
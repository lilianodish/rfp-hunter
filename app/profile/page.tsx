'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfileStore } from '@/lib/stores/profileStore';
import { ProfileCompleteness } from '@/components/profile/ProfileCompleteness';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, Shield, Wrench, Award, Clock, Edit, Download, Upload, Trash2,
  ChevronRight, AlertTriangle, TrendingUp, Unlock, DollarSign, MapPin
} from 'lucide-react';
import { ProfileSection } from '@/lib/types/profile';

const sectionIcons = {
  basics: Building2,
  insurance: Shield,
  services: Wrench,
  equipment: Wrench,
  certifications: Award,
  operational: Clock,
};

const sectionDescriptions = {
  basics: 'Essential company information and contact details',
  insurance: 'Coverage amounts and policy information',
  services: 'Services you offer to clients',
  equipment: 'Equipment and capabilities',
  certifications: 'Licenses, certifications, and compliance',
  operational: 'Work availability and operational constraints',
};

export default function ProfilePage() {
  const router = useRouter();
  const [editingSection, setEditingSection] = useState<ProfileSection | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const {
    profile,
    isHydrated,
    updateBasics,
    updateInsurance,
    updateServices,
    updateEquipment,
    updateCertifications,
    updateOperational,
    clearProfile,
    getCompleteness,
    getMissingFields,
  } = useProfileStore();

  useEffect(() => {
    useProfileStore.persist.rehydrate();
  }, []);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const completeness = getCompleteness();
  const missingFields = getMissingFields();
  const qualificationRate = Math.round(completeness.overall * 0.9); // Simulated qualification rate

  const handleExport = () => {
    setIsExporting(true);
    const dataStr = JSON.stringify(profile, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `company-profile-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    setTimeout(() => setIsExporting(false), 1000);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedProfile = JSON.parse(e.target?.result as string);
        // Update each section
        if (importedProfile.basics) updateBasics(importedProfile.basics);
        if (importedProfile.insurance) updateInsurance(importedProfile.insurance);
        if (importedProfile.services) updateServices(importedProfile.services);
        if (importedProfile.equipment) updateEquipment(importedProfile.equipment);
        if (importedProfile.certifications) updateCertifications(importedProfile.certifications);
        if (importedProfile.operational) updateOperational(importedProfile.operational);
        
        setIsImporting(false);
      } catch (error) {
        console.error('Failed to import profile:', error);
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const handleDelete = () => {
    clearProfile();
    setShowDeleteConfirm(false);
    router.push('/onboarding');
  };

  const getSectionCompleteness = (section: ProfileSection) => {
    return completeness.sections[section];
  };

  const getSectionSummary = (section: ProfileSection) => {
    switch (section) {
      case 'basics':
        return `${profile.basics.companyName || 'No company name'} • ${profile.basics.city || 'No location'}, ${profile.basics.state || ''}`;
      case 'insurance':
        const glAmount = profile.insurance.generalLiability?.amount;
        return glAmount ? `GL: $${glAmount.toLocaleString()} • WC: ${profile.insurance.workersComp?.hasIt ? 'Yes' : 'No'}` : 'No insurance info';
      case 'services':
        const serviceCount = Object.values(profile.services).filter(v => v).length;
        return `${serviceCount} services selected`;
      case 'equipment':
        const hasHotWater = profile.equipment.hotWater?.capable;
        const trucks = profile.equipment.numberOfTrucks;
        return `${hasHotWater ? 'Hot water capable' : 'No hot water'} • ${trucks || 0} trucks`;
      case 'certifications':
        const certCount = Object.values(profile.certifications).filter(v => v).length;
        return `${certCount} certifications/licenses`;
      case 'operational':
        const availability = [];
        if (profile.operational.nightWork) availability.push('Nights');
        if (profile.operational.weekendWork) availability.push('Weekends');
        if (profile.operational.holidayWork) availability.push('Holidays');
        return availability.length > 0 ? availability.join(' • ') : 'Standard hours only';
    }
  };

  if (!profile.basics.companyName) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>No Profile Found</CardTitle>
            <CardDescription>
              You haven't set up your company profile yet. Create one to start analyzing RFPs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full"
              onClick={() => router.push('/onboarding')}
            >
              Create Profile
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{profile.basics.companyName}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {profile.basics.city}, {profile.basics.state} • Established {profile.basics.yearEstablished || 'Unknown'}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <ProfileCompleteness size="lg" showLabel />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">RFP Qualification Rate</p>
                  <p className="text-2xl font-bold">{qualificationRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Missing Fields</p>
                  <p className="text-2xl font-bold">{missingFields.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unlock Potential</p>
                  <p className="text-2xl font-bold">+50</p>
                </div>
                <Unlock className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-6">
            <Button variant="outline" onClick={handleExport} disabled={isExporting}>
              <Download className="h-4 w-4 mr-1" />
              {isExporting ? 'Exporting...' : 'Export Profile'}
            </Button>
            
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('import-file')?.click()}
                disabled={isImporting}
              >
                <Upload className="h-4 w-4 mr-1" />
                {isImporting ? 'Importing...' : 'Import Profile'}
              </Button>
            </div>
            
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Profile
            </Button>
          </div>
        </div>

        {/* Missing Fields Alert */}
        {missingFields.filter(f => f.required).length > 0 && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Complete Your Profile
              </CardTitle>
              <CardDescription>
                Add these required fields to qualify for more RFPs:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {missingFields.filter(f => f.required).slice(0, 5).map((field, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingSection(field.section)}
                  >
                    Add {field.label}
                  </Button>
                ))}
                {missingFields.filter(f => f.required).length > 5 && (
                  <span className="text-sm text-muted-foreground self-center">
                    +{missingFields.filter(f => f.required).length - 5} more
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.keys(completeness.sections) as ProfileSection[]).map((section) => {
            const Icon = sectionIcons[section];
            const sectionComplete = getSectionCompleteness(section);
            
            return (
              <Card
                key={section}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setEditingSection(section)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {section.charAt(0).toUpperCase() + section.slice(1)}
                    </span>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                  <CardDescription>{sectionDescriptions[section]}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Completeness</span>
                        <span>{Math.round(sectionComplete)}%</span>
                      </div>
                      <Progress value={sectionComplete} className="h-2" />
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {getSectionSummary(section)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recommendations */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>
              Complete these items to unlock more RFP opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {!profile.certifications.samRegistration && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Add SAM.gov Registration</p>
                      <p className="text-sm text-muted-foreground">Required for federal contracts</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingSection('certifications')}
                  >
                    Add Now
                  </Button>
                </div>
              )}
              
              {!profile.insurance.umbrella?.amount && (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Add Umbrella Insurance</p>
                      <p className="text-sm text-muted-foreground">Many large contracts require $5M+ coverage</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingSection('insurance')}
                  >
                    Add Now
                  </Button>
                </div>
              )}
              
              {!profile.equipment.hotWater?.capable && (
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Wrench className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Add Hot Water Capability</p>
                      <p className="text-sm text-muted-foreground">Essential for grease and oil removal jobs</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingSection('equipment')}
                  >
                    Add Now
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Section Dialog */}
        <Dialog open={editingSection !== null} onOpenChange={(open) => !open && setEditingSection(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" onClose={() => setEditingSection(null)}>
            <DialogHeader>
              <DialogTitle>
                Edit {editingSection ? editingSection.charAt(0).toUpperCase() + editingSection.slice(1) : ''}
              </DialogTitle>
              <DialogDescription>
                Update your {editingSection} information
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4">
              {/* Section-specific edit forms would go here */}
              {/* For brevity, showing a placeholder */}
              <p className="text-muted-foreground">
                Edit form for {editingSection} section would appear here with all relevant fields.
              </p>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSection(null)}>
                Cancel
              </Button>
              <Button onClick={() => setEditingSection(null)}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent onClose={() => setShowDeleteConfirm(false)}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Delete Profile?
              </DialogTitle>
              <DialogDescription>
                This will permanently delete your company profile and all associated data. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
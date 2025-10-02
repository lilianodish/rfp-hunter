'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfileStore } from '@/lib/stores/profileStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Building2, Shield, Wrench, Award, Clock, ChevronRight, ChevronLeft, AlertTriangle,
  Sparkles, Info, DollarSign, Calendar, Users, MapPin, Hash
} from 'lucide-react';

const steps = [
  { id: 1, title: 'Company Basics', icon: Building2, description: 'Essential company information' },
  { id: 2, title: 'Insurance', icon: Shield, description: 'Coverage and liability details' },
  { id: 3, title: 'Services & Equipment', icon: Wrench, description: 'What you offer and how' },
  { id: 4, title: 'Certifications', icon: Award, description: 'Licenses and compliance' },
  { id: 5, title: 'Operations', icon: Clock, description: 'Availability and constraints' },
];

const states = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];

const services = [
  { key: 'buildingExterior', label: 'Building Exterior' },
  { key: 'concrete', label: 'Concrete Cleaning' },
  { key: 'parkingStructure', label: 'Parking Structure' },
  { key: 'graffiti', label: 'Graffiti Removal' },
  { key: 'emergency247', label: '24/7 Emergency' },
  { key: 'oilStain', label: 'Oil Stain Removal' },
  { key: 'gumRemoval', label: 'Gum Removal' },
  { key: 'driveThrough', label: 'Drive-Through Areas' },
  { key: 'awnings', label: 'Awnings' },
  { key: 'dumpsterAreas', label: 'Dumpster Areas' },
  { key: 'sidewalks', label: 'Sidewalks' },
  { key: 'brickCleaning', label: 'Brick Cleaning' },
  { key: 'graffitiRemoval', label: 'Graffiti Treatment' },
  { key: 'rustRemoval', label: 'Rust Removal' },
  { key: 'fleetWashing', label: 'Fleet Washing' },
  { key: 'solarPanels', label: 'Solar Panel Cleaning' },
  { key: 'windows', label: 'Window Washing' },
  { key: 'roofCleaning', label: 'Roof Cleaning' },
  { key: 'deckCleaning', label: 'Deck Cleaning' },
  { key: 'fenceCleaning', label: 'Fence Cleaning' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  
  const {
    profile,
    updateBasics,
    updateInsurance,
    updateServices,
    updateEquipment,
    updateCertifications,
    updateOperational,
    getCompleteness,
  } = useProfileStore();

  const completeness = getCompleteness();
  const stepProgress = (currentStep / steps.length) * 100;

  const saveAndContinue = async () => {
    setIsSaving(true);
    // Simulate save delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSaving(false);
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowCompletion(true);
      setTimeout(() => {
        router.push('/profile');
      }, 3000);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push('/profile');
    }
    setShowSkipWarning(false);
  };

  if (showCompletion) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <Sparkles className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Profile Complete!</h1>
          <p className="text-lg text-muted-foreground">
            You can now analyze RFPs with {Math.round(completeness.overall)}% accuracy
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Company Profile Setup</h1>
            <Button
              variant="outline"
              onClick={() => setShowSkipWarning(true)}
              className="text-sm"
            >
              Skip Setup
            </Button>
          </div>
          
          {/* Step Progress */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex justify-between mb-2">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center ${
                    step.id <= currentStep ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <step.icon className="h-5 w-5 mr-1" />
                  <span className="text-sm hidden sm:inline">{step.title}</span>
                </div>
              ))}
            </div>
            <Progress value={stepProgress} className="h-2" />
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {steps[currentStep - 1].icon && <steps[currentStep - 1].icon className="h-6 w-6" />}
                  {steps[currentStep - 1].title}
                </CardTitle>
                <CardDescription>{steps[currentStep - 1].description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Step 1: Company Basics */}
                {currentStep === 1 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name*</Label>
                      <Input
                        id="companyName"
                        placeholder="ABC Pressure Washing Inc."
                        value={profile.basics.companyName || ''}
                        onChange={(e) => updateBasics({ companyName: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dbaName">DBA Name (if different)</Label>
                      <Input
                        id="dbaName"
                        placeholder="ABC Pro Wash"
                        value={profile.basics.dbaName || ''}
                        onChange={(e) => updateBasics({ dbaName: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Street Address*</Label>
                      <Input
                        id="address"
                        placeholder="123 Main Street"
                        value={profile.basics.address || ''}
                        onChange={(e) => updateBasics({ address: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="city">City*</Label>
                      <Input
                        id="city"
                        placeholder="Houston"
                        value={profile.basics.city || ''}
                        onChange={(e) => updateBasics({ city: e.target.value })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="state">State*</Label>
                        <select
                          id="state"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={profile.basics.state || ''}
                          onChange={(e) => updateBasics({ state: e.target.value })}
                        >
                          <option value="">Select</option>
                          {states.map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="zip">ZIP Code*</Label>
                        <Input
                          id="zip"
                          placeholder="77001"
                          value={profile.basics.zip || ''}
                          onChange={(e) => updateBasics({ zip: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="yearEstablished">Year Established*</Label>
                      <Input
                        id="yearEstablished"
                        type="number"
                        placeholder="2010"
                        value={profile.basics.yearEstablished || ''}
                        onChange={(e) => updateBasics({ yearEstablished: parseInt(e.target.value) })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="entityType">Entity Type*</Label>
                      <select
                        id="entityType"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={profile.basics.entityType || ''}
                        onChange={(e) => updateBasics({ entityType: e.target.value as any })}
                      >
                        <option value="">Select</option>
                        <option value="LLC">LLC</option>
                        <option value="Corporation">Corporation</option>
                        <option value="Partnership">Partnership</option>
                        <option value="Sole Proprietorship">Sole Proprietorship</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ein">EIN/Tax ID*</Label>
                      <Input
                        id="ein"
                        placeholder="12-3456789"
                        value={profile.basics.ein || ''}
                        onChange={(e) => updateBasics({ ein: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="employees">Number of Employees*</Label>
                      <Input
                        id="employees"
                        type="number"
                        placeholder="25"
                        value={profile.basics.employees || ''}
                        onChange={(e) => updateBasics({ employees: parseInt(e.target.value) })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="crews">Number of Crews</Label>
                      <Input
                        id="crews"
                        type="number"
                        placeholder="5"
                        value={profile.basics.crews || ''}
                        onChange={(e) => updateBasics({ crews: parseInt(e.target.value) })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="serviceRadius">Service Radius (miles)</Label>
                      <Input
                        id="serviceRadius"
                        type="number"
                        placeholder="50"
                        value={profile.basics.serviceRadius || ''}
                        onChange={(e) => updateBasics({ serviceRadius: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Insurance */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="border rounded-lg p-4 space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        General Liability
                      </h3>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="glAmount">Coverage Amount*</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="glAmount"
                              type="number"
                              placeholder="1000000"
                              className="pl-8"
                              value={profile.insurance.generalLiability?.amount || ''}
                              onChange={(e) => updateInsurance({
                                generalLiability: {
                                  ...profile.insurance.generalLiability,
                                  amount: parseInt(e.target.value)
                                }
                              })}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">Typical: $1M - $2M</p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="glCarrier">Insurance Carrier*</Label>
                          <Input
                            id="glCarrier"
                            placeholder="State Farm"
                            value={profile.insurance.generalLiability?.carrier || ''}
                            onChange={(e) => updateInsurance({
                              generalLiability: {
                                ...profile.insurance.generalLiability,
                                carrier: e.target.value
                              }
                            })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="glExpiry">Expiration Date*</Label>
                          <Input
                            id="glExpiry"
                            type="date"
                            value={profile.insurance.generalLiability?.expiry || ''}
                            onChange={(e) => updateInsurance({
                              generalLiability: {
                                ...profile.insurance.generalLiability,
                                expiry: e.target.value
                              }
                            })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Workers Compensation
                      </h3>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="wcHas">Have Coverage?*</Label>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="wcHas"
                              checked={profile.insurance.workersComp?.hasIt || false}
                              onCheckedChange={(checked) => updateInsurance({
                                workersComp: {
                                  ...profile.insurance.workersComp,
                                  hasIt: checked
                                }
                              })}
                            />
                            <Label htmlFor="wcHas" className="cursor-pointer">
                              {profile.insurance.workersComp?.hasIt ? 'Yes' : 'No'}
                            </Label>
                          </div>
                        </div>
                        
                        {profile.insurance.workersComp?.hasIt && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="wcCarrier">Insurance Carrier</Label>
                              <Input
                                id="wcCarrier"
                                placeholder="State Fund"
                                value={profile.insurance.workersComp?.carrier || ''}
                                onChange={(e) => updateInsurance({
                                  workersComp: {
                                    ...profile.insurance.workersComp,
                                    carrier: e.target.value
                                  }
                                })}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="wcExpiry">Expiration Date</Label>
                              <Input
                                id="wcExpiry"
                                type="date"
                                value={profile.insurance.workersComp?.expiry || ''}
                                onChange={(e) => updateInsurance({
                                  workersComp: {
                                    ...profile.insurance.workersComp,
                                    expiry: e.target.value
                                  }
                                })}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="border rounded-lg p-4 space-y-4">
                        <h3 className="font-semibold">Commercial Auto</h3>
                        <div className="space-y-2">
                          <Label htmlFor="caAmount">Coverage Amount</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="caAmount"
                              type="number"
                              placeholder="1000000"
                              className="pl-8"
                              value={profile.insurance.commercialAuto?.amount || ''}
                              onChange={(e) => updateInsurance({
                                commercialAuto: {
                                  ...profile.insurance.commercialAuto,
                                  amount: parseInt(e.target.value)
                                }
                              })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="caCarrier">Carrier</Label>
                          <Input
                            id="caCarrier"
                            placeholder="Progressive"
                            value={profile.insurance.commercialAuto?.carrier || ''}
                            onChange={(e) => updateInsurance({
                              commercialAuto: {
                                ...profile.insurance.commercialAuto,
                                carrier: e.target.value
                              }
                            })}
                          />
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 space-y-4">
                        <h3 className="font-semibold">Additional Coverage</h3>
                        <div className="space-y-2">
                          <Label htmlFor="umbrellaAmount">Umbrella Policy</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="umbrellaAmount"
                              type="number"
                              placeholder="5000000"
                              className="pl-8"
                              value={profile.insurance.umbrella?.amount || ''}
                              onChange={(e) => updateInsurance({
                                umbrella: {
                                  amount: parseInt(e.target.value)
                                }
                              })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profAmount">Professional Liability</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="profAmount"
                              type="number"
                              placeholder="1000000"
                              className="pl-8"
                              value={profile.insurance.professional?.amount || ''}
                              onChange={(e) => updateInsurance({
                                professional: {
                                  amount: parseInt(e.target.value)
                                }
                              })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Services & Equipment */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4">Services Offered</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {services.map((service) => (
                          <div key={service.key} className="flex items-center space-x-2">
                            <Checkbox
                              id={service.key}
                              checked={profile.services[service.key as keyof typeof profile.services] || false}
                              onCheckedChange={(checked) => updateServices({
                                [service.key]: checked
                              })}
                            />
                            <Label
                              htmlFor={service.key}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {service.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold">Equipment Capabilities</h3>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="border rounded-lg p-4 space-y-4">
                          <h4 className="font-medium">Hot Water System</h4>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="hotWaterCapable"
                                checked={profile.equipment.hotWater?.capable || false}
                                onCheckedChange={(checked) => updateEquipment({
                                  hotWater: {
                                    ...profile.equipment.hotWater,
                                    capable: checked
                                  }
                                })}
                              />
                              <Label htmlFor="hotWaterCapable">Hot water capable</Label>
                            </div>
                            
                            {profile.equipment.hotWater?.capable && (
                              <>
                                <div className="space-y-2">
                                  <Label htmlFor="hotWaterTemp">Max Temperature (°F)</Label>
                                  <Input
                                    id="hotWaterTemp"
                                    type="number"
                                    placeholder="200"
                                    value={profile.equipment.hotWater?.maxTemp || ''}
                                    onChange={(e) => updateEquipment({
                                      hotWater: {
                                        ...profile.equipment.hotWater,
                                        maxTemp: parseInt(e.target.value)
                                      }
                                    })}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="hotWaterPSI">PSI</Label>
                                  <Input
                                    id="hotWaterPSI"
                                    type="number"
                                    placeholder="3500"
                                    value={profile.equipment.hotWater?.psi || ''}
                                    onChange={(e) => updateEquipment({
                                      hotWater: {
                                        ...profile.equipment.hotWater,
                                        psi: parseInt(e.target.value)
                                      }
                                    })}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="border rounded-lg p-4 space-y-4">
                          <h4 className="font-medium">Cold Water System</h4>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="coldWaterCapable"
                                checked={profile.equipment.coldWater?.capable || false}
                                onCheckedChange={(checked) => updateEquipment({
                                  coldWater: {
                                    ...profile.equipment.coldWater,
                                    capable: checked
                                  }
                                })}
                              />
                              <Label htmlFor="coldWaterCapable">Cold water capable</Label>
                            </div>
                            
                            {profile.equipment.coldWater?.capable && (
                              <div className="space-y-2">
                                <Label htmlFor="coldWaterPSI">PSI</Label>
                                <Input
                                  id="coldWaterPSI"
                                  type="number"
                                  placeholder="4000"
                                  value={profile.equipment.coldWater?.psi || ''}
                                  onChange={(e) => updateEquipment({
                                    coldWater: {
                                      ...profile.equipment.coldWater,
                                      psi: parseInt(e.target.value)
                                    }
                                  })}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="numberOfTrucks">Number of Trucks/Rigs</Label>
                          <Input
                            id="numberOfTrucks"
                            type="number"
                            placeholder="5"
                            value={profile.equipment.numberOfTrucks || ''}
                            onChange={(e) => updateEquipment({ numberOfTrucks: parseInt(e.target.value) })}
                          />
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="waterRecovery"
                              checked={profile.equipment.waterRecovery || false}
                              onCheckedChange={(checked) => updateEquipment({ waterRecovery: checked })}
                            />
                            <Label htmlFor="waterRecovery">Water recovery system</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="aerialLift"
                              checked={profile.equipment.aerialLift || false}
                              onCheckedChange={(checked) => updateEquipment({ aerialLift: checked })}
                            />
                            <Label htmlFor="aerialLift">Aerial lift equipment</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="surfaceCleaners"
                              checked={profile.equipment.surfaceCleaners || false}
                              onCheckedChange={(checked) => updateEquipment({ surfaceCleaners: checked })}
                            />
                            <Label htmlFor="surfaceCleaners">Surface cleaners</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="chemicalSystem"
                              checked={profile.equipment.chemicalSystem || false}
                              onCheckedChange={(checked) => updateEquipment({ chemicalSystem: checked })}
                            />
                            <Label htmlFor="chemicalSystem">Chemical injection system</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="epaApprovedChemicals"
                              checked={profile.equipment.epaApprovedChemicals || false}
                              onCheckedChange={(checked) => updateEquipment({ epaApprovedChemicals: checked })}
                            />
                            <Label htmlFor="epaApprovedChemicals">EPA approved chemicals only</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Certifications */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-4">
                        <h4 className="font-medium">Licenses & Compliance</h4>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="businessLicense">Business License</Label>
                          <Switch
                            id="businessLicense"
                            checked={profile.certifications.businessLicense || false}
                            onCheckedChange={(checked) => updateCertifications({ businessLicense: checked })}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="contractorLicense">Contractor License</Label>
                          <Switch
                            id="contractorLicense"
                            checked={profile.certifications.contractorLicense || false}
                            onCheckedChange={(checked) => updateCertifications({ contractorLicense: checked })}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="epaCompliant">EPA Compliant</Label>
                          <Switch
                            id="epaCompliant"
                            checked={profile.certifications.epaCompliant || false}
                            onCheckedChange={(checked) => updateCertifications({ epaCompliant: checked })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="oshaLevel">OSHA Certification</Label>
                          <select
                            id="oshaLevel"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={profile.certifications.oshaLevel || ''}
                            onChange={(e) => updateCertifications({ oshaLevel: e.target.value as any })}
                          >
                            <option value="">None</option>
                            <option value="10-hour">10-hour</option>
                            <option value="30-hour">30-hour</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="prevailingWage" className="flex items-center gap-1">
                            Prevailing Wage Certified
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </Label>
                          <Switch
                            id="prevailingWage"
                            checked={profile.certifications.prevailingWage || false}
                            onCheckedChange={(checked) => updateCertifications({ prevailingWage: checked })}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Federal Registrations</h4>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="samRegistration">SAM.gov Registration</Label>
                          <Switch
                            id="samRegistration"
                            checked={profile.certifications.samRegistration || false}
                            onCheckedChange={(checked) => updateCertifications({ samRegistration: checked })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="cageCode">CAGE Code</Label>
                          <Input
                            id="cageCode"
                            placeholder="5 character code"
                            value={profile.certifications.cageCode || ''}
                            onChange={(e) => updateCertifications({ cageCode: e.target.value })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="dunsNumber">DUNS Number</Label>
                          <Input
                            id="dunsNumber"
                            placeholder="9 digit number"
                            value={profile.certifications.dunsNumber || ''}
                            onChange={(e) => updateCertifications({ dunsNumber: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-4">Business Classifications</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="smallBusiness">Small Business</Label>
                          <Switch
                            id="smallBusiness"
                            checked={profile.certifications.smallBusiness || false}
                            onCheckedChange={(checked) => updateCertifications({ smallBusiness: checked })}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="minorityOwned">Minority Owned</Label>
                          <Switch
                            id="minorityOwned"
                            checked={profile.certifications.minorityOwned || false}
                            onCheckedChange={(checked) => updateCertifications({ minorityOwned: checked })}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="womanOwned">Woman Owned</Label>
                          <Switch
                            id="womanOwned"
                            checked={profile.certifications.womanOwned || false}
                            onCheckedChange={(checked) => updateCertifications({ womanOwned: checked })}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="veteranOwned">Veteran Owned</Label>
                          <Switch
                            id="veteranOwned"
                            checked={profile.certifications.veteranOwned || false}
                            onCheckedChange={(checked) => updateCertifications({ veteranOwned: checked })}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="hubZone">HUBZone</Label>
                          <Switch
                            id="hubZone"
                            checked={profile.certifications.hubZone || false}
                            onCheckedChange={(checked) => updateCertifications({ hubZone: checked })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Operations */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-4">Work Availability</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <Label htmlFor="nightWork" className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Night Work
                          </Label>
                          <Switch
                            id="nightWork"
                            checked={profile.operational.nightWork || false}
                            onCheckedChange={(checked) => updateOperational({ nightWork: checked })}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <Label htmlFor="weekendWork" className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Weekend Work
                          </Label>
                          <Switch
                            id="weekendWork"
                            checked={profile.operational.weekendWork || false}
                            onCheckedChange={(checked) => updateOperational({ weekendWork: checked })}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <Label htmlFor="holidayWork" className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Holiday Work
                          </Label>
                          <Switch
                            id="holidayWork"
                            checked={profile.operational.holidayWork || false}
                            onCheckedChange={(checked) => updateOperational({ holidayWork: checked })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="minimumContract">Minimum Contract Value</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="minimumContract"
                            type="number"
                            placeholder="500"
                            className="pl-8"
                            value={profile.operational.minimumContract || ''}
                            onChange={(e) => updateOperational({ minimumContract: parseInt(e.target.value) })}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Leave blank for no minimum</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="maxSimultaneousJobs">Max Simultaneous Jobs</Label>
                        <Input
                          id="maxSimultaneousJobs"
                          type="number"
                          placeholder="10"
                          value={profile.operational.maxSimultaneousJobs || ''}
                          onChange={(e) => updateOperational({ maxSimultaneousJobs: parseInt(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground">Your capacity for concurrent projects</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="emergencyResponseTime">Emergency Response Time (hours)</Label>
                        <Input
                          id="emergencyResponseTime"
                          type="number"
                          placeholder="2"
                          value={profile.operational.emergencyResponseTime || ''}
                          onChange={(e) => updateOperational({ emergencyResponseTime: parseInt(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground">How quickly you can respond to emergencies</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="paymentTermsRequired">Payment Terms Required</Label>
                        <select
                          id="paymentTermsRequired"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={profile.operational.paymentTermsRequired || ''}
                          onChange={(e) => updateOperational({ paymentTermsRequired: e.target.value as any })}
                        >
                          <option value="">Select payment terms</option>
                          <option value="COD">Cash on Delivery (COD)</option>
                          <option value="Net 15">Net 15</option>
                          <option value="Net 30">Net 30</option>
                          <option value="Net 45">Net 45</option>
                          <option value="Net 60">Net 60</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={goBack}
                  disabled={currentStep === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                
                <div className="flex gap-2">
                  {isSaving && (
                    <span className="text-sm text-muted-foreground flex items-center">
                      Saving...
                    </span>
                  )}
                  <Button onClick={saveAndContinue}>
                    {currentStep === steps.length ? 'Complete Setup' : 'Save & Continue'}
                    {currentStep < steps.length && <ChevronRight className="h-4 w-4 ml-1" />}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Skip Warning Dialog */}
        <Dialog open={showSkipWarning} onOpenChange={setShowSkipWarning}>
          <DialogContent onClose={() => setShowSkipWarning(false)}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Skip Profile Setup?
              </DialogTitle>
              <DialogDescription>
                Skipping setup will reduce RFP matching accuracy. You can always complete your profile later, but you may miss out on opportunities.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSkipWarning(false)}>
                Continue Setup
              </Button>
              <Button variant="destructive" onClick={handleSkip}>
                Skip Anyway
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
import { NextRequest, NextResponse } from 'next/server';
import { CompanyProfile, ProfileSection } from '@/lib/types/profile';

interface ValidationResult {
  completeness: number;
  missingCritical: {
    section: ProfileSection;
    field: string;
    label: string;
  }[];
  suggestions: string[];
  unlockedRFPs: number;
  sectionScores: {
    [K in ProfileSection]: number;
  };
}

function calculateCompleteness(profile: CompanyProfile): number {
  const sections = {
    basics: 0,
    insurance: 0,
    services: 0,
    equipment: 0,
    certifications: 0,
    operational: 0,
  };

  // Calculate basics completeness (30% weight)
  const basicsFields = ['companyName', 'address', 'city', 'state', 'zip', 'yearEstablished', 'entityType', 'ein', 'employees', 'serviceRadius'];
  const basicsCompleted = basicsFields.filter((field) => profile.basics[field as keyof typeof profile.basics]).length;
  sections.basics = (basicsCompleted / basicsFields.length) * 100;

  // Calculate insurance completeness (25% weight)
  let insurancePoints = 0;
  if (profile.insurance.generalLiability?.amount) insurancePoints += 40;
  if (profile.insurance.workersComp?.hasIt !== undefined) insurancePoints += 30;
  if (profile.insurance.commercialAuto?.amount) insurancePoints += 20;
  if (profile.insurance.umbrella?.amount) insurancePoints += 5;
  if (profile.insurance.professional?.amount) insurancePoints += 5;
  sections.insurance = insurancePoints;

  // Calculate services completeness (15% weight)
  const servicesSelected = Object.values(profile.services).filter(v => v === true).length;
  sections.services = Math.min(100, (servicesSelected / 5) * 100); // At least 5 services for 100%

  // Calculate equipment completeness (15% weight)
  let equipmentPoints = 0;
  if (profile.equipment.hotWater?.capable !== undefined) equipmentPoints += 20;
  if (profile.equipment.hotWater?.psi) equipmentPoints += 10;
  if (profile.equipment.coldWater?.capable !== undefined) equipmentPoints += 20;
  if (profile.equipment.coldWater?.psi) equipmentPoints += 10;
  if (profile.equipment.waterRecovery !== undefined) equipmentPoints += 10;
  if (profile.equipment.numberOfTrucks) equipmentPoints += 10;
  if (profile.equipment.surfaceCleaners !== undefined) equipmentPoints += 10;
  if (profile.equipment.epaApprovedChemicals !== undefined) equipmentPoints += 10;
  sections.equipment = equipmentPoints;

  // Calculate certifications completeness (10% weight)
  let certPoints = 0;
  if (profile.certifications.businessLicense !== undefined) certPoints += 30;
  if (profile.certifications.contractorLicense !== undefined) certPoints += 20;
  if (profile.certifications.epaCompliant !== undefined) certPoints += 20;
  if (profile.certifications.oshaLevel && profile.certifications.oshaLevel !== 'None') certPoints += 20;
  if (profile.certifications.samRegistration !== undefined) certPoints += 10;
  sections.certifications = certPoints;

  // Calculate operational completeness (5% weight)
  let opPoints = 0;
  if (profile.operational.nightWork !== undefined) opPoints += 20;
  if (profile.operational.weekendWork !== undefined) opPoints += 20;
  if (profile.operational.emergencyResponseTime !== undefined) opPoints += 30;
  if (profile.operational.paymentTermsRequired) opPoints += 30;
  sections.operational = opPoints;

  // Calculate weighted overall completeness
  const weights = {
    basics: 0.30,
    insurance: 0.25,
    services: 0.15,
    equipment: 0.15,
    certifications: 0.10,
    operational: 0.05
  };

  const overall = Object.entries(sections).reduce((sum, [section, score]) => {
    return sum + (score * weights[section as ProfileSection]);
  }, 0);

  return Math.round(overall);
}

function findCriticalMissing(profile: CompanyProfile): ValidationResult['missingCritical'] {
  const missing: ValidationResult['missingCritical'] = [];

  // Critical basics fields
  if (!profile.basics.companyName) {
    missing.push({ section: 'basics', field: 'companyName', label: 'Company Name' });
  }
  if (!profile.basics.address) {
    missing.push({ section: 'basics', field: 'address', label: 'Business Address' });
  }
  if (!profile.basics.city) {
    missing.push({ section: 'basics', field: 'city', label: 'City' });
  }
  if (!profile.basics.state) {
    missing.push({ section: 'basics', field: 'state', label: 'State' });
  }
  if (!profile.basics.zip) {
    missing.push({ section: 'basics', field: 'zip', label: 'ZIP Code' });
  }
  if (!profile.basics.serviceRadius) {
    missing.push({ section: 'basics', field: 'serviceRadius', label: 'Service Radius' });
  }

  // Critical insurance
  if (!profile.insurance.generalLiability?.amount) {
    missing.push({ section: 'insurance', field: 'generalLiability', label: 'General Liability Coverage' });
  }
  if (profile.insurance.workersComp?.hasIt === undefined) {
    missing.push({ section: 'insurance', field: 'workersComp', label: 'Workers Compensation Status' });
  }

  // At least one service
  const hasServices = Object.values(profile.services).some(v => v === true);
  if (!hasServices) {
    missing.push({ section: 'services', field: 'any', label: 'At least one service' });
  }

  // Critical certifications
  if (profile.certifications.businessLicense === undefined) {
    missing.push({ section: 'certifications', field: 'businessLicense', label: 'Business License Status' });
  }

  return missing;
}

function generateSuggestions(profile: CompanyProfile): string[] {
  const suggestions: string[] = [];
  const completeness = calculateCompleteness(profile);

  // Priority suggestions based on what's missing
  if (!profile.basics.serviceRadius) {
    suggestions.push('Set your service radius to unlock location-based RFP matching');
  }

  if (!profile.insurance.generalLiability?.amount) {
    suggestions.push('Add your General Liability coverage amount - this is required for most RFPs');
  }

  const servicesCount = Object.values(profile.services).filter(v => v === true).length;
  if (servicesCount < 5) {
    suggestions.push(`Add ${5 - servicesCount} more services to expand your RFP opportunities`);
  }

  if (!profile.equipment.hotWater?.capable && !profile.equipment.coldWater?.capable) {
    suggestions.push('Specify your pressure washing equipment capabilities');
  }

  if (!profile.certifications.samRegistration) {
    suggestions.push('Register on SAM.gov to access federal government contracts');
  }

  if (profile.certifications.oshaLevel === 'None' || !profile.certifications.oshaLevel) {
    suggestions.push('Consider OSHA certification to qualify for more commercial RFPs');
  }

  if (!profile.operational.emergencyResponseTime) {
    suggestions.push('Add emergency response capability to qualify for 24/7 service RFPs');
  }

  // Completeness-based suggestions
  if (completeness < 50) {
    suggestions.unshift('Complete at least 50% of your profile to get accurate RFP matches');
  } else if (completeness < 80) {
    suggestions.push('Complete your profile to 80% for optimal RFP matching accuracy');
  }

  return suggestions.slice(0, 5); // Return top 5 suggestions
}

function estimateQualifiedRFPs(profile: CompanyProfile): number {
  const completeness = calculateCompleteness(profile);
  
  // Base estimate on completeness and key factors
  let estimate = 0;
  
  // Basic qualification (company info + insurance)
  if (profile.basics.companyName && profile.insurance.generalLiability?.amount) {
    estimate += 100; // Basic commercial RFPs
  }
  
  // Service radius defined
  if (profile.basics.serviceRadius) {
    estimate += 50; // Location-specific RFPs
  }
  
  // Government certifications
  if (profile.certifications.samRegistration) {
    estimate += 200; // Federal RFPs
  }
  
  // Specialized services
  const specializedServices = ['graffiti', 'emergency247', 'solarPanels', 'roofCleaning'];
  const hasSpecialized = specializedServices.some(s => profile.services[s as keyof typeof profile.services]);
  if (hasSpecialized) {
    estimate += 75; // Specialized RFPs
  }
  
  // Equipment capabilities
  if (profile.equipment.hotWater?.capable && profile.equipment.waterRecovery) {
    estimate += 50; // Environmental/advanced RFPs
  }
  
  // Adjust by completeness
  estimate = Math.round(estimate * (completeness / 100));
  
  return estimate;
}

export async function POST(request: NextRequest) {
  try {
    const profile = await request.json() as CompanyProfile;

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile data is required' },
        { status: 400 }
      );
    }

    const completeness = calculateCompleteness(profile);
    const missingCritical = findCriticalMissing(profile);
    const suggestions = generateSuggestions(profile);
    const unlockedRFPs = estimateQualifiedRFPs(profile);

    // Calculate section scores for detailed breakdown
    const sectionScores = {
      basics: 0,
      insurance: 0,
      services: 0,
      equipment: 0,
      certifications: 0,
      operational: 0,
    };

    // Reuse the section calculations from calculateCompleteness
    // (In a real implementation, we'd refactor to avoid duplication)
    const basicsFields = ['companyName', 'address', 'city', 'state', 'zip', 'yearEstablished', 'entityType', 'ein', 'employees', 'serviceRadius'];
    const basicsCompleted = basicsFields.filter((field) => profile.basics[field as keyof typeof profile.basics]).length;
    sectionScores.basics = Math.round((basicsCompleted / basicsFields.length) * 100);

    // Insurance score
    let insurancePoints = 0;
    if (profile.insurance.generalLiability?.amount) insurancePoints += 40;
    if (profile.insurance.workersComp?.hasIt !== undefined) insurancePoints += 30;
    if (profile.insurance.commercialAuto?.amount) insurancePoints += 20;
    if (profile.insurance.umbrella?.amount) insurancePoints += 5;
    if (profile.insurance.professional?.amount) insurancePoints += 5;
    sectionScores.insurance = insurancePoints;

    // Services score
    const servicesSelected = Object.values(profile.services).filter(v => v === true).length;
    sectionScores.services = Math.min(100, Math.round((servicesSelected / 5) * 100));

    // Equipment score
    let equipmentPoints = 0;
    if (profile.equipment.hotWater?.capable !== undefined) equipmentPoints += 20;
    if (profile.equipment.hotWater?.psi) equipmentPoints += 10;
    if (profile.equipment.coldWater?.capable !== undefined) equipmentPoints += 20;
    if (profile.equipment.coldWater?.psi) equipmentPoints += 10;
    if (profile.equipment.waterRecovery !== undefined) equipmentPoints += 10;
    if (profile.equipment.numberOfTrucks) equipmentPoints += 10;
    if (profile.equipment.surfaceCleaners !== undefined) equipmentPoints += 10;
    if (profile.equipment.epaApprovedChemicals !== undefined) equipmentPoints += 10;
    sectionScores.equipment = equipmentPoints;

    // Certifications score
    let certPoints = 0;
    if (profile.certifications.businessLicense !== undefined) certPoints += 30;
    if (profile.certifications.contractorLicense !== undefined) certPoints += 20;
    if (profile.certifications.epaCompliant !== undefined) certPoints += 20;
    if (profile.certifications.oshaLevel && profile.certifications.oshaLevel !== 'None') certPoints += 20;
    if (profile.certifications.samRegistration !== undefined) certPoints += 10;
    sectionScores.certifications = certPoints;

    // Operational score
    let opPoints = 0;
    if (profile.operational.nightWork !== undefined) opPoints += 20;
    if (profile.operational.weekendWork !== undefined) opPoints += 20;
    if (profile.operational.emergencyResponseTime !== undefined) opPoints += 30;
    if (profile.operational.paymentTermsRequired) opPoints += 30;
    sectionScores.operational = opPoints;

    const result: ValidationResult = {
      completeness,
      missingCritical,
      suggestions,
      unlockedRFPs,
      sectionScores
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Profile validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
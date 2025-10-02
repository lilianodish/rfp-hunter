export interface CompanyProfile {
  basics: {
    companyName?: string;
    dbaName?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    yearEstablished?: number;
    entityType?: 'LLC' | 'Corporation' | 'Partnership' | 'Sole Proprietorship' | 'Other';
    ein?: string;
    employees?: number;
    crews?: number;
    serviceRadius?: number;
  };
  insurance: {
    generalLiability?: {
      amount?: number;
      carrier?: string;
      expiry?: string;
    };
    workersComp?: {
      hasIt?: boolean;
      carrier?: string;
      expiry?: string;
    };
    commercialAuto?: {
      amount?: number;
      carrier?: string;
    };
    umbrella?: {
      amount?: number;
    };
    professional?: {
      amount?: number;
    };
  };
  services: {
    buildingExterior?: boolean;
    concrete?: boolean;
    parkingStructure?: boolean;
    graffiti?: boolean;
    emergency247?: boolean;
    oilStain?: boolean;
    gumRemoval?: boolean;
    driveThrough?: boolean;
    awnings?: boolean;
    dumpsterAreas?: boolean;
    sidewalks?: boolean;
    brickCleaning?: boolean;
    graffitiRemoval?: boolean;
    rustRemoval?: boolean;
    fleetWashing?: boolean;
    solarPanels?: boolean;
    windows?: boolean;
    roofCleaning?: boolean;
    deckCleaning?: boolean;
    fenceCleaning?: boolean;
  };
  equipment: {
    hotWater?: {
      capable?: boolean;
      maxTemp?: number;
      psi?: number;
    };
    coldWater?: {
      capable?: boolean;
      psi?: number;
    };
    waterRecovery?: boolean;
    numberOfTrucks?: number;
    aerialLift?: boolean;
    surfaceCleaners?: boolean;
    chemicalSystem?: boolean;
    epaApprovedChemicals?: boolean;
  };
  certifications: {
    businessLicense?: boolean;
    contractorLicense?: boolean;
    epaCompliant?: boolean;
    oshaLevel?: '10-hour' | '30-hour' | 'None';
    prevailingWage?: boolean;
    samRegistration?: boolean;
    cageCode?: string;
    dunsNumber?: string;
    smallBusiness?: boolean;
    minorityOwned?: boolean;
    womanOwned?: boolean;
    veteranOwned?: boolean;
    hubZone?: boolean;
  };
  operational: {
    nightWork?: boolean;
    weekendWork?: boolean;
    holidayWork?: boolean;
    minimumContract?: number;
    maxSimultaneousJobs?: number;
    emergencyResponseTime?: number;
    paymentTermsRequired?: 'Net 15' | 'Net 30' | 'Net 45' | 'Net 60' | 'COD';
  };
}

export type ProfileSection = keyof CompanyProfile;

export interface ProfileCompleteness {
  overall: number;
  sections: {
    [K in ProfileSection]: number;
  };
}

export interface MissingField {
  section: ProfileSection;
  field: string;
  label: string;
  required?: boolean;
}
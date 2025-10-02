import { CompanyProfile } from '@/lib/types/profile';

interface InsuranceRequirement {
  generalLiability?: number;
  workersComp?: boolean;
  commercialAuto?: number;
  umbrella?: number;
  professional?: number;
}

interface ServiceRequirement {
  services: string[];
}

interface CertificationRequirement {
  certifications: string[];
  licenses?: string[];
}

interface EquipmentRequirement {
  minPSI?: number;
  hotWater?: boolean;
  waterRecovery?: boolean;
  aerialLift?: boolean;
}

interface OperationalRequirement {
  nightWork?: boolean;
  weekendWork?: boolean;
  emergencyResponse?: boolean;
  maxResponseTime?: number;
}

/**
 * Calculate insurance match score
 * @param required Required insurance coverage
 * @param actual Company's actual insurance coverage
 * @returns Score from 0-100
 */
export function calculateInsuranceMatch(
  required: InsuranceRequirement,
  actual: CompanyProfile['insurance']
): number {
  let totalPoints = 0;
  let earnedPoints = 0;

  // General Liability (40 points)
  if (required.generalLiability !== undefined) {
    totalPoints += 40;
    if (actual.generalLiability?.amount && actual.generalLiability.amount >= required.generalLiability) {
      earnedPoints += 40;
    } else if (actual.generalLiability?.amount) {
      // Partial credit if they have some coverage but not enough
      const ratio = actual.generalLiability.amount / required.generalLiability;
      earnedPoints += Math.min(20, ratio * 40);
    }
  }

  // Workers Compensation (30 points)
  if (required.workersComp !== undefined) {
    totalPoints += 30;
    if (actual.workersComp?.hasIt === required.workersComp) {
      earnedPoints += 30;
    }
  }

  // Commercial Auto (20 points)
  if (required.commercialAuto !== undefined) {
    totalPoints += 20;
    if (actual.commercialAuto?.amount && actual.commercialAuto.amount >= required.commercialAuto) {
      earnedPoints += 20;
    } else if (actual.commercialAuto?.amount) {
      const ratio = actual.commercialAuto.amount / required.commercialAuto;
      earnedPoints += Math.min(10, ratio * 20);
    }
  }

  // Umbrella Policy (5 points)
  if (required.umbrella !== undefined) {
    totalPoints += 5;
    if (actual.umbrella?.amount && actual.umbrella.amount >= required.umbrella) {
      earnedPoints += 5;
    }
  }

  // Professional Liability (5 points)
  if (required.professional !== undefined) {
    totalPoints += 5;
    if (actual.professional?.amount && actual.professional.amount >= required.professional) {
      earnedPoints += 5;
    }
  }

  // If no specific requirements, check basic coverage
  if (totalPoints === 0) {
    totalPoints = 100;
    if (actual.generalLiability?.amount) earnedPoints += 50;
    if (actual.workersComp?.hasIt) earnedPoints += 30;
    if (actual.commercialAuto?.amount) earnedPoints += 20;
  }

  return totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 100;
}

/**
 * Map service keywords to our service types
 */
const SERVICE_MAPPING: Record<string, keyof CompanyProfile['services']> = {
  'building': 'buildingExterior',
  'exterior': 'buildingExterior',
  'concrete': 'concrete',
  'parking': 'parkingStructure',
  'garage': 'parkingStructure',
  'graffiti': 'graffiti',
  'emergency': 'emergency247',
  '24/7': 'emergency247',
  'oil': 'oilStain',
  'stain': 'oilStain',
  'gum': 'gumRemoval',
  'drive-through': 'driveThrough',
  'drive through': 'driveThrough',
  'awning': 'awnings',
  'canopy': 'awnings',
  'dumpster': 'dumpsterAreas',
  'trash': 'dumpsterAreas',
  'sidewalk': 'sidewalks',
  'walkway': 'sidewalks',
  'brick': 'brickCleaning',
  'masonry': 'brickCleaning',
  'rust': 'rustRemoval',
  'fleet': 'fleetWashing',
  'vehicle': 'fleetWashing',
  'truck': 'fleetWashing',
  'solar': 'solarPanels',
  'panel': 'solarPanels',
  'window': 'windows',
  'glass': 'windows',
  'roof': 'roofCleaning',
  'deck': 'deckCleaning',
  'patio': 'deckCleaning',
  'fence': 'fenceCleaning',
};

/**
 * Calculate services match score
 * @param required Required services
 * @param actual Company's actual services
 * @returns Score from 0-100
 */
export function calculateServicesMatch(
  required: string[],
  actual: CompanyProfile['services']
): number {
  if (!required || required.length === 0) return 100;

  let matchedServices = 0;
  const unmatchedServices: string[] = [];

  for (const requiredService of required) {
    const serviceLower = requiredService.toLowerCase();
    let matched = false;

    // Direct match check
    for (const [keyword, serviceKey] of Object.entries(SERVICE_MAPPING)) {
      if (serviceLower.includes(keyword) && actual[serviceKey] === true) {
        matched = true;
        break;
      }
    }

    // Check if the service name directly matches any of our services
    if (!matched) {
      const directMatch = Object.keys(actual).find(key => 
        serviceLower.includes(key.toLowerCase()) || 
        key.toLowerCase().includes(serviceLower)
      );
      if (directMatch && actual[directMatch as keyof CompanyProfile['services']] === true) {
        matched = true;
      }
    }

    if (matched) {
      matchedServices++;
    } else {
      unmatchedServices.push(requiredService);
    }
  }

  const score = (matchedServices / required.length) * 100;
  
  // Store unmatched services for reporting
  (calculateServicesMatch as any).lastUnmatched = unmatchedServices;
  
  return score;
}

/**
 * Map certification keywords to our certification types
 */
const CERT_MAPPING: Record<string, string> = {
  'business license': 'businessLicense',
  'contractor': 'contractorLicense',
  'contractors': 'contractorLicense',
  'epa': 'epaCompliant',
  'environmental': 'epaCompliant',
  'osha': 'oshaLevel',
  'safety': 'oshaLevel',
  'prevailing': 'prevailingWage',
  'prevailing wage': 'prevailingWage',
  'davis bacon': 'prevailingWage',
  'sam': 'samRegistration',
  'sam.gov': 'samRegistration',
  'cage': 'cageCode',
  'duns': 'dunsNumber',
  'd-u-n-s': 'dunsNumber',
  'small business': 'smallBusiness',
  'sbe': 'smallBusiness',
  'minority': 'minorityOwned',
  'mbe': 'minorityOwned',
  'woman': 'womanOwned',
  'women': 'womanOwned',
  'wbe': 'womanOwned',
  'veteran': 'veteranOwned',
  'vbe': 'veteranOwned',
  'hubzone': 'hubZone',
  'hub zone': 'hubZone',
};

/**
 * Calculate certifications match score
 * @param required Required certifications
 * @param actual Company's actual certifications
 * @returns Score from 0-100
 */
export function calculateCertsMatch(
  required: string[],
  actual: CompanyProfile['certifications']
): number {
  if (!required || required.length === 0) return 100;

  let matchedCerts = 0;
  let partialMatches = 0;
  const unmatchedCerts: string[] = [];

  for (const requiredCert of required) {
    const certLower = requiredCert.toLowerCase();
    let matched = false;
    let partial = false;

    // Check for direct matches
    for (const [keyword, certKey] of Object.entries(CERT_MAPPING)) {
      if (certLower.includes(keyword)) {
        const certValue = actual[certKey as keyof CompanyProfile['certifications']];
        
        if (certValue === true || (certValue && certValue !== 'None')) {
          matched = true;
          break;
        } else if (certValue === false) {
          // They explicitly don't have it
          partial = false;
          break;
        }
      }
    }

    // Special handling for OSHA levels
    if (!matched && certLower.includes('osha')) {
      if (certLower.includes('30') && actual.oshaLevel === '30-hour') {
        matched = true;
      } else if (certLower.includes('10') && (actual.oshaLevel === '10-hour' || actual.oshaLevel === '30-hour')) {
        matched = true; // 30-hour cert covers 10-hour requirement
      } else if (actual.oshaLevel && actual.oshaLevel !== 'None') {
        partial = true; // They have some OSHA cert
      }
    }

    // Check for ISO certifications (not in our standard list but might be mentioned)
    if (!matched && certLower.includes('iso')) {
      // We can't match ISO certs specifically, but note them
      partial = true;
    }

    if (matched) {
      matchedCerts++;
    } else if (partial) {
      partialMatches++;
    } else {
      unmatchedCerts.push(requiredCert);
    }
  }

  // Calculate score with partial credit
  const fullMatches = matchedCerts;
  const partialCredit = partialMatches * 0.5;
  const totalCredit = fullMatches + partialCredit;
  const score = (totalCredit / required.length) * 100;
  
  // Store unmatched certs for reporting
  (calculateCertsMatch as any).lastUnmatched = unmatchedCerts;
  
  return score;
}

/**
 * Calculate equipment match score
 * @param required Required equipment specifications
 * @param actual Company's actual equipment
 * @returns Score from 0-100
 */
export function calculateEquipmentMatch(
  required: EquipmentRequirement,
  actual: CompanyProfile['equipment']
): number {
  let totalPoints = 0;
  let earnedPoints = 0;

  // PSI requirements (40 points)
  if (required.minPSI !== undefined) {
    totalPoints += 40;
    
    // Check both hot and cold water PSI
    const hotPSI = actual.hotWater?.psi || 0;
    const coldPSI = actual.coldWater?.psi || 0;
    const maxPSI = Math.max(hotPSI, coldPSI);
    
    if (maxPSI >= required.minPSI) {
      earnedPoints += 40;
    } else if (maxPSI > 0) {
      // Partial credit
      const ratio = maxPSI / required.minPSI;
      earnedPoints += Math.min(20, ratio * 40);
    }
  }

  // Hot water capability (30 points)
  if (required.hotWater !== undefined) {
    totalPoints += 30;
    if (actual.hotWater?.capable === required.hotWater) {
      earnedPoints += 30;
    }
  }

  // Water recovery (20 points)
  if (required.waterRecovery !== undefined) {
    totalPoints += 20;
    if (actual.waterRecovery === required.waterRecovery) {
      earnedPoints += 20;
    }
  }

  // Aerial lift (10 points)
  if (required.aerialLift !== undefined) {
    totalPoints += 10;
    if (actual.aerialLift === required.aerialLift) {
      earnedPoints += 10;
    }
  }

  // If no specific requirements, give full score if they have basic equipment
  if (totalPoints === 0) {
    totalPoints = 100;
    if (actual.hotWater?.capable || actual.coldWater?.capable) earnedPoints += 40;
    if (actual.numberOfTrucks && actual.numberOfTrucks > 0) earnedPoints += 30;
    if (actual.surfaceCleaners) earnedPoints += 15;
    if (actual.chemicalSystem) earnedPoints += 15;
  }

  return totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 100;
}

/**
 * Calculate operational match score
 * @param required Required operational capabilities
 * @param actual Company's actual operational capabilities
 * @returns Score from 0-100
 */
export function calculateOperationalMatch(
  required: OperationalRequirement,
  actual: CompanyProfile['operational']
): number {
  let totalPoints = 0;
  let earnedPoints = 0;

  // Night work capability (30 points)
  if (required.nightWork !== undefined) {
    totalPoints += 30;
    if (actual.nightWork === required.nightWork) {
      earnedPoints += 30;
    }
  }

  // Weekend work capability (30 points)
  if (required.weekendWork !== undefined) {
    totalPoints += 30;
    if (actual.weekendWork === required.weekendWork) {
      earnedPoints += 30;
    }
  }

  // Emergency response (40 points)
  if (required.emergencyResponse !== undefined) {
    totalPoints += 40;
    // Check if they offer 24/7 emergency service
    if (required.emergencyResponse && actual.emergencyResponseTime !== undefined) {
      // They have emergency response capability
      earnedPoints += 20;
      
      // Additional points for response time
      if (required.maxResponseTime && actual.emergencyResponseTime <= required.maxResponseTime) {
        earnedPoints += 20;
      } else if (actual.emergencyResponseTime <= 4) {
        // Good response time even if not specified
        earnedPoints += 10;
      }
    } else if (!required.emergencyResponse) {
      // They don't need emergency response
      earnedPoints += 40;
    }
  }

  // If no specific requirements, give full score
  if (totalPoints === 0) {
    return 100;
  }

  return (earnedPoints / totalPoints) * 100;
}

/**
 * Format missing requirement for display
 */
export function formatMissingRequirement(
  category: string,
  requirement: string,
  actual?: any
): string {
  switch (category) {
    case 'insurance':
      if (requirement.includes('Liability') && actual) {
        return `General Liability: Required $${requirement}, have $${actual}`;
      }
      return requirement;
    
    case 'services':
      return `Service not offered: ${requirement}`;
    
    case 'certifications':
      return `Missing certification: ${requirement}`;
    
    case 'equipment':
      return `Equipment requirement: ${requirement}`;
    
    case 'operational':
      return `Operational capability: ${requirement}`;
    
    default:
      return requirement;
  }
}

/**
 * Determine if a missing requirement is easily fillable
 */
export function isFillableGap(category: string, requirement: string): boolean {
  const easilyFillable = {
    insurance: ['umbrella', 'professional'], // Can be obtained quickly
    certifications: ['businessLicense', 'samRegistration', 'cageCode'], // Can be obtained in days/weeks
    operational: ['nightWork', 'weekendWork'], // Policy changes
  };

  if (easilyFillable[category as keyof typeof easilyFillable]) {
    return easilyFillable[category as keyof typeof easilyFillable].some(item => 
      requirement.toLowerCase().includes(item.toLowerCase())
    );
  }

  return false;
}
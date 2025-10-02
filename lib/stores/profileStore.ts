import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CompanyProfile, ProfileSection, ProfileCompleteness, MissingField } from '@/lib/types/profile';

interface ProfileStore {
  profile: CompanyProfile;
  isHydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  updateBasics: (basics: Partial<CompanyProfile['basics']>) => void;
  updateInsurance: (insurance: Partial<CompanyProfile['insurance']>) => void;
  updateServices: (services: Partial<CompanyProfile['services']>) => void;
  updateEquipment: (equipment: Partial<CompanyProfile['equipment']>) => void;
  updateCertifications: (certifications: Partial<CompanyProfile['certifications']>) => void;
  updateOperational: (operational: Partial<CompanyProfile['operational']>) => void;
  clearProfile: () => void;
  getCompleteness: () => ProfileCompleteness;
  getMissingFields: () => MissingField[];
  checkRequirement: (section: ProfileSection, field: string, value?: any) => boolean;
}

const initialProfile: CompanyProfile = {
  basics: {},
  insurance: {
    generalLiability: {},
    workersComp: {},
    commercialAuto: {},
    umbrella: {},
    professional: {},
  },
  services: {},
  equipment: {
    hotWater: {},
    coldWater: {},
  },
  certifications: {},
  operational: {},
};

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      profile: initialProfile,
      isHydrated: false,
      
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
      
      updateBasics: (basics) =>
        set((state) => ({
          profile: {
            ...state.profile,
            basics: { ...state.profile.basics, ...basics },
          },
        })),
      
      updateInsurance: (insurance) =>
        set((state) => ({
          profile: {
            ...state.profile,
            insurance: { ...state.profile.insurance, ...insurance },
          },
        })),
      
      updateServices: (services) =>
        set((state) => ({
          profile: {
            ...state.profile,
            services: { ...state.profile.services, ...services },
          },
        })),
      
      updateEquipment: (equipment) =>
        set((state) => ({
          profile: {
            ...state.profile,
            equipment: { ...state.profile.equipment, ...equipment },
          },
        })),
      
      updateCertifications: (certifications) =>
        set((state) => ({
          profile: {
            ...state.profile,
            certifications: { ...state.profile.certifications, ...certifications },
          },
        })),
      
      updateOperational: (operational) =>
        set((state) => ({
          profile: {
            ...state.profile,
            operational: { ...state.profile.operational, ...operational },
          },
        })),
      
      clearProfile: () => set({ profile: initialProfile }),
      
      getCompleteness: () => {
        const { profile } = get();
        const sections: ProfileCompleteness['sections'] = {
          basics: 0,
          insurance: 0,
          services: 0,
          equipment: 0,
          certifications: 0,
          operational: 0,
        };
        
        // Calculate basics completeness
        const basicsFields = ['companyName', 'address', 'city', 'state', 'zip', 'yearEstablished', 'entityType', 'ein', 'employees', 'crews', 'serviceRadius'];
        const basicsCompleted = basicsFields.filter((field) => profile.basics[field as keyof typeof profile.basics]).length;
        sections.basics = (basicsCompleted / basicsFields.length) * 100;
        
        // Calculate insurance completeness
        let insuranceTotal = 0;
        let insuranceCompleted = 0;
        if (profile.insurance.generalLiability?.amount) insuranceCompleted++;
        if (profile.insurance.generalLiability?.carrier) insuranceCompleted++;
        if (profile.insurance.generalLiability?.expiry) insuranceCompleted++;
        insuranceTotal += 3;
        
        if (profile.insurance.workersComp?.hasIt !== undefined) insuranceCompleted++;
        if (profile.insurance.workersComp?.carrier) insuranceCompleted++;
        if (profile.insurance.workersComp?.expiry) insuranceCompleted++;
        insuranceTotal += 3;
        
        if (profile.insurance.commercialAuto?.amount) insuranceCompleted++;
        if (profile.insurance.commercialAuto?.carrier) insuranceCompleted++;
        insuranceTotal += 2;
        
        if (profile.insurance.umbrella?.amount) insuranceCompleted++;
        if (profile.insurance.professional?.amount) insuranceCompleted++;
        insuranceTotal += 2;
        
        sections.insurance = insuranceTotal > 0 ? (insuranceCompleted / insuranceTotal) * 100 : 0;
        
        // Calculate services completeness
        const servicesFields = Object.keys(profile.services);
        const totalServices = 20;
        sections.services = (servicesFields.length / totalServices) * 100;
        
        // Calculate equipment completeness
        let equipmentTotal = 8;
        let equipmentCompleted = 0;
        if (profile.equipment.hotWater?.capable !== undefined) equipmentCompleted++;
        if (profile.equipment.hotWater?.maxTemp) equipmentCompleted++;
        if (profile.equipment.hotWater?.psi) equipmentCompleted++;
        if (profile.equipment.coldWater?.capable !== undefined) equipmentCompleted++;
        if (profile.equipment.coldWater?.psi) equipmentCompleted++;
        if (profile.equipment.waterRecovery !== undefined) equipmentCompleted++;
        if (profile.equipment.numberOfTrucks) equipmentCompleted++;
        if (profile.equipment.aerialLift !== undefined) equipmentCompleted++;
        if (profile.equipment.surfaceCleaners !== undefined) equipmentCompleted++;
        if (profile.equipment.chemicalSystem !== undefined) equipmentCompleted++;
        if (profile.equipment.epaApprovedChemicals !== undefined) equipmentCompleted++;
        
        sections.equipment = equipmentTotal > 0 ? (equipmentCompleted / 11) * 100 : 0;
        
        // Calculate certifications completeness
        const certFields = ['businessLicense', 'contractorLicense', 'epaCompliant', 'oshaLevel', 'prevailingWage', 
          'samRegistration', 'cageCode', 'dunsNumber', 'smallBusiness', 'minorityOwned', 'womanOwned', 'veteranOwned', 'hubZone'];
        const certCompleted = certFields.filter((field) => profile.certifications[field as keyof typeof profile.certifications] !== undefined).length;
        sections.certifications = (certCompleted / certFields.length) * 100;
        
        // Calculate operational completeness
        const opFields = ['nightWork', 'weekendWork', 'holidayWork', 'minimumContract', 'maxSimultaneousJobs', 'emergencyResponseTime', 'paymentTermsRequired'];
        const opCompleted = opFields.filter((field) => profile.operational[field as keyof typeof profile.operational] !== undefined).length;
        sections.operational = (opCompleted / opFields.length) * 100;
        
        // Calculate overall completeness
        const overall = Object.values(sections).reduce((sum, value) => sum + value, 0) / Object.keys(sections).length;
        
        return {
          overall,
          sections,
        };
      },
      
      getMissingFields: () => {
        const { profile } = get();
        const missing: MissingField[] = [];
        
        // Check basics
        const basicsRequired = [
          { field: 'companyName', label: 'Company Name' },
          { field: 'address', label: 'Address' },
          { field: 'city', label: 'City' },
          { field: 'state', label: 'State' },
          { field: 'zip', label: 'ZIP Code' },
          { field: 'yearEstablished', label: 'Year Established' },
          { field: 'entityType', label: 'Entity Type' },
          { field: 'ein', label: 'EIN' },
          { field: 'employees', label: 'Number of Employees' },
        ];
        
        basicsRequired.forEach(({ field, label }) => {
          if (!profile.basics[field as keyof typeof profile.basics]) {
            missing.push({ section: 'basics', field, label, required: true });
          }
        });
        
        // Check insurance
        if (!profile.insurance.generalLiability?.amount) {
          missing.push({ section: 'insurance', field: 'generalLiability.amount', label: 'General Liability Coverage', required: true });
        }
        if (profile.insurance.workersComp?.hasIt === undefined) {
          missing.push({ section: 'insurance', field: 'workersComp.hasIt', label: 'Workers Compensation', required: true });
        }
        
        // Check services - at least one service should be selected
        const hasServices = Object.values(profile.services).some(v => v === true);
        if (!hasServices) {
          missing.push({ section: 'services', field: 'any', label: 'At least one service', required: true });
        }
        
        // Check certifications
        if (profile.certifications.businessLicense === undefined) {
          missing.push({ section: 'certifications', field: 'businessLicense', label: 'Business License', required: true });
        }
        
        return missing;
      },
      
      checkRequirement: (section, field, value) => {
        const { profile } = get();
        const sectionData = profile[section];
        
        // Handle nested fields
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          const parentData = sectionData[parent as keyof typeof sectionData];
          if (typeof parentData === 'object' && parentData !== null) {
            const fieldValue = (parentData as any)[child];
            return value !== undefined ? fieldValue === value : fieldValue !== undefined;
          }
          return false;
        }
        
        const fieldValue = sectionData[field as keyof typeof sectionData];
        return value !== undefined ? fieldValue === value : fieldValue !== undefined;
      },
    }),
    {
      name: 'company-profile',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
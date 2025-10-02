export interface SampleRFP {
  title: string;
  content: string;
  expectedScore: number;
  category: string;
}

export const sampleRFPs = {
  easy: {
    title: 'City of Glendale Pressure Washing',
    content: `City of Glendale Pressure Washing Services
Location: Glendale Civic Center, 613 E Broadway, Glendale, CA
Requirements:
- General Liability: $1M minimum
- Service radius: Within 20 miles
- Hot water pressure washing capability
- Monthly service schedule
- EPA compliant operations
Services: Building exterior, sidewalks, parking structure
Budget: $5,000/month
Contact: facilities@glendale.gov
Deadline: 30 days from posting`,
    expectedScore: 95,
    category: 'government',
  },
  
  medium: {
    title: 'LAX Airport Facility Cleaning',
    content: `Los Angeles Airport Facility Cleaning
Location: LAX Airport, Los Angeles, CA  
Requirements:
- General Liability: $5M minimum
- Specialized runway cleaning equipment
- 24/7 emergency response
- Prevailing wage certified
- Airport security clearance
Services: Terminal exterior, runway marks removal
Budget: $25,000/month
Contact: procurement@lawa.org
Special Requirements: TSA background checks required`,
    expectedScore: 60,
    category: 'aviation',
  },
  
  hard: {
    title: 'Golden Gate Bridge Maintenance',
    content: `San Francisco Bridge Maintenance
Location: Golden Gate Bridge, San Francisco, CA
Requirements:
- General Liability: $10M minimum
- Specialized bridge equipment
- Working at heights certification
- Marine equipment for under-bridge
- Union labor required
Services: Bridge cable cleaning, tower maintenance
Budget: $100,000/month
Contact: maintenance@goldengate.org
Special Requirements: Coast Guard certification for marine operations`,
    expectedScore: 20,
    category: 'infrastructure',
  },
  
  retail: {
    title: 'Target Stores Regional Cleaning',
    content: `Target Corporation - Regional Store Cleaning Contract
Locations: 15 stores across Southern California
Requirements:
- General Liability: $2M minimum
- Workers Comp coverage required
- Background checks for all employees
- Green cleaning products only
- Night and weekend availability
Services: Floor care, restroom maintenance, cart sanitization
Budget: $8,000/month per store
Contact: vendor.relations@target.com
Special Requirements: Target vendor certification required`,
    expectedScore: 75,
    category: 'retail',
  },
  
  government: {
    title: 'County Hospital System Cleaning',
    content: `Los Angeles County Hospital System
Locations: 5 medical facilities countywide
Requirements:
- General Liability: $3M minimum
- Healthcare facility experience (5 years)
- OSHA bloodborne pathogen certified
- HIPAA compliance training
- 24/7 emergency response capability
Services: Medical facility cleaning, biohazard disposal, OR terminal cleaning
Budget: $50,000/month
Contact: procurement@lacounty.gov
Special Requirements: Joint Commission standards compliance`,
    expectedScore: 40,
    category: 'healthcare',
  },
  
  emergency: {
    title: 'Emergency Spill Response Services',
    content: `California Emergency Spill Response
Coverage Area: Statewide on-call services
Requirements:
- General Liability: $5M minimum
- Hazmat certification required
- 2-hour response time guarantee
- Specialized spill equipment
- EPA emergency response certified
Services: Chemical spills, oil spills, biohazard cleanup
Budget: $10,000/month retainer + per incident
Contact: emergency@calema.ca.gov
Special Requirements: CalOSHA certified, DEQ permits`,
    expectedScore: 30,
    category: 'emergency',
  },
  
  commercial: {
    title: 'Office Park Janitorial Services',
    content: `Irvine Business Complex Cleaning
Location: 2525 Main Street, Irvine, CA 92614
Requirements:
- General Liability: $1M minimum
- Workers Comp required
- Evening service (after 6pm)
- Green cleaning products
- 5 days per week service
Services: Office cleaning, restroom supplies, trash removal, carpet cleaning
Budget: $12,000/month
Contact: property@irvineco.com
Special Requirements: Background checks for all staff`,
    expectedScore: 90,
    category: 'commercial',
  },
};
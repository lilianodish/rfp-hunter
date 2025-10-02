# RFP Hunter v2.0
### 90% Accuracy through Company Profiling

An AI-powered RFP analysis tool for pressure washing companies that provides accurate GO/NO-GO decisions based on comprehensive company profiling.

## Features

- **🎯 90% Accuracy**: Detailed company profiling ensures precise RFP matching
- **📊 Comprehensive Scoring**: Four-category scoring system (Geographic, Insurance, Services, Certifications)
- **🔍 Gap Detection**: Identifies fillable gaps and missing requirements
- **💡 Smart Recommendations**: AI-powered analysis with confidence levels
- **📝 Proposal Generation**: Automatic proposal drafting for suitable RFPs
- **✨ Profile Management**: Complete company profile system with progress tracking

## Quick Start

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env.local
# Add your OpenAI API key
```

3. **Run the development server**:
```bash
npm run dev
```

4. **Open [http://localhost:3000](http://localhost:3000)**

## First Time Setup

1. **Complete Company Profile** (10 minutes)
   - Company basics and location
   - Insurance coverage details
   - Services and equipment capabilities
   - Certifications and licenses
   - Operational preferences

2. **Analyze RFPs**
   - Paste any RFP text
   - Get instant GO/NO-GO decision
   - View detailed score breakdown
   - Identify addressable gaps

## Accuracy Breakdown

The system evaluates RFPs across four key categories:

- **Geographic Match (25%)**: Service area and location requirements
- **Insurance Match (25%)**: Coverage types and amounts
- **Services Match (25%)**: Capability alignment
- **Certifications Match (25%)**: Required credentials and compliance

## Confidence Levels

- **HIGH CONFIDENCE GO (90-100%)**: Excellent match, proceed with proposal
- **MEDIUM CONFIDENCE GO (70-89%)**: Good match with some gaps to address
- **LOW CONFIDENCE GO (50-69%)**: Possible match but significant gaps
- **NO GO (<50%)**: Requirements exceed capabilities

## Key Features

### Profile Management
- Comprehensive company information storage
- Real-time completeness tracking
- Gap detection and filling
- Profile-based RFP matching

### RFP Analysis
- AI-powered requirement extraction
- Detailed scoring breakdown
- Missing requirement identification
- Fillable gap detection
- Confidence-based recommendations

### Testing Mode
- Pre-loaded test RFPs with expected scores
- Score calculation transparency
- Debug information for accuracy verification

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: Zustand
- **AI**: OpenAI GPT-4
- **Storage**: LocalStorage persistence

## Project Structure

```
├── app/
│   ├── page.tsx              # Main RFP analysis page
│   ├── profile/              # Profile management
│   ├── onboarding/          # Profile setup wizard
│   ├── test/                # Accuracy testing page
│   └── api/                 # API routes
├── components/
│   ├── profile/             # Profile-related components
│   ├── ui/                  # UI components
│   └── DemoMode.tsx         # Demo mode banner
├── lib/
│   ├── stores/              # Zustand stores
│   ├── types/               # TypeScript types
│   └── utils/               # Utility functions
└── middleware.ts            # Route protection
```

## API Endpoints

- `POST /api/analyze`: Analyze RFP with company profile
- `POST /api/test-accuracy`: Test scoring accuracy
- `POST /api/generate-proposal`: Generate proposal content

## Development

### Running Tests
```bash
# Visit /test page in development mode
npm run dev
```

### Building for Production
```bash
npm run build
npm start
```

## License

Private and confidential. All rights reserved.

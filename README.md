# SnapOps Vision

Offline-First AI Industrial Inspection Assistant

SnapOps Vision is a real-time, offline-first industrial inspection application designed to help field technicians perform structured equipment inspections using AI-assisted visual analysis, OCR, SOP verification, evidence capture, findings management, and automated reporting.

The architecture is designed to support Snapdragon-powered Windows PCs through a dedicated Qualcomm AI integration layer and Qualcomm AI Hub model workflow.

## Live Application

https://snapops-vision.vercel.app

## Source Repository

https://github.com/Sreevalli20/snapdragon.git

## Why SnapOps Vision?

Industrial inspections often require technicians to simultaneously:

- Identify equipment and components
- Read labels and serial information
- Follow safety and maintenance procedures
- Verify inspection steps
- Capture evidence
- Document findings
- Prepare audit-ready reports

SnapOps Vision combines these activities into a single guided workflow.

The application is designed around a local-first architecture so that core inspection workflows can continue without requiring continuous cloud connectivity.

## Core Workflow

```
WorkPack
    ↓
Inspection
    ↓
Live Camera
    ↓
AI Visual Analysis
    ↓
OCR
    ↓
SOP Verification
    ↓
Evidence Capture
    ↓
Findings
    ↓
Inspection Report
```

## Key Capabilities

### Real-Time Inspection

- Live camera inspection interface
- Camera permission handling
- Camera device selection
- Pause/resume controls
- Torch support where available
- Resolution/status information
- Real-time inspection workflow

### AI-Assisted Vision

The local AI layer uses TensorFlow.js for browser-based visual inference.

The application maintains provider-independent AI adapters so that AI execution can be switched between supported runtimes.

### OCR

Tesseract.js provides local OCR for extracting text from captured inspection evidence.

OCR results include extracted text and confidence information.

### SOP Verification

The SOP engine provides:

- Structured inspection steps
- Validation rules
- Component matching
- Regex-based validation
- Step status tracking
- Failure guidance
- Manual override handling
- Audit trail support

### Evidence Management

Inspection evidence can be:

- Captured
- Stored locally
- Reviewed
- Filtered
- Searched
- Downloaded
- Associated with inspection steps
- Displayed with OCR metadata

### Findings

Findings support:

- Critical
- Warning
- Informational

Severity levels together with finding status and corrective recommendations.

### Reporting

The reporting system provides:

- Inspection summary
- SOP verification matrix
- Evidence appendix
- Findings summary
- Manual override audit trail
- Printable reports
- JSON export

### Offline-First Storage

IndexedDB is used for local persistence of:

- Inspections
- Evidence
- WorkPacks
- Findings
- Telemetry

The application also provides fallback storage where appropriate.

### WorkPacks

The application includes industrial inspection WorkPacks such as:

**Industrial Equipment Inspection**

Three-phase motor and VFD inspection workflow.

**Solar Inverter Inspection**

Solar inverter and high-voltage DC disconnect workflow.

**Automated Conveyor Inspection**

Conveyor and emergency-stop safety inspection workflow.

Custom WorkPacks can also be created.

## Qualcomm AI / Snapdragon Architecture

SnapOps Vision includes a dedicated:

- QualcommAIAdapter

alongside:

- DevelopmentAIAdapter
- LocalAIAdapter
- QualcommAIAdapter

This provider-independent architecture separates application logic from the underlying AI runtime.

### Qualcomm AI Hub

The Qualcomm integration layer is designed around Qualcomm AI Hub capabilities for:

- Model discovery
- Snapdragon target identification
- Optimized model selection
- Deployment preparation
- Runtime integration

Registered Qualcomm AI Hub model information includes suitable OCR and vision models such as:

- EasyOCR
- TrOCR
- MobileNet-v2

Model capabilities are represented according to their actual supported tasks.

### Snapdragon Validation Status

Qualcomm AI Hub integration and target discovery were verified during development.

The current development environment is x86_64 Windows and does not contain a physical Snapdragon X-series HP PC.

Therefore:

- Physical Snapdragon NPU execution and hardware benchmarking have NOT been claimed or fabricated.

The application instead detects the current environment and safely operates through its available local/fallback runtime.

The Qualcomm adapter provides the integration boundary for deployment and validation on compatible Snapdragon hardware.

### AI Runtime Architecture

```
                    SnapOps Vision
                           │
                     AIAdapterFactory
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
 DevelopmentAI       LocalAI          QualcommAI
    Adapter           Adapter           Adapter
          │                │                │
          ▼                ▼                ▼
   Development       TensorFlow.js    Qualcomm AI
      AI/API             + OCR          Hub / Edge
```

This architecture allows the inspection application to remain independent of a single AI provider.

## Technology Stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Motion

### AI / Computer Vision

- TensorFlow.js
- Tesseract.js
- Qualcomm AI Hub integration layer

### Speech

- Web Speech API
- Browser speech synthesis where supported

### Storage

- IndexedDB
- localStorage fallback where appropriate

### Backend

- Express
- TypeScript
- esbuild

### Deployment

- Vercel

### Development

- Node.js
- Python
- Qualcomm AI Hub tooling
- Git/GitHub

## Security

Secrets are intentionally excluded from the repository.

Qualcomm credentials must be supplied through environment variables and must never be commit to Git.

Example:

```
QAI_HUB_API_TOKEN=
```

The actual token must remain local/private.

Similarly, client-side variables must never contain private credentials.

## Running Locally

Clone the repository:

```bash
git clone https://github.com/Sreevalli20/snapdragon.git
cd snapdragon
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Run validation:

```bash
npm run lint
npm run test
npm run build
```

The application can then be opened using the development URL reported by Vite.

## Environment Variables

Create a local `.env.local` file when required.

Example:

```
QAI_HUB_API_TOKEN=
GEMINI_API_KEY=
APP_URL=
```

Never commit `.env.local`.

Never put private credentials into `NEXT_PUBLIC_*` variables.

## Testing

The current project verification includes:

- TypeScript/lint validation
- Unit/integration tests
- AI adapter tests
- Vision tests
- SOP tests
- Speech integration tests
- WorkPack tests
- Production build verification
- Live Vercel deployment verification

Current automated test result:

```
19/19 tests passed
```

Production build:

```
PASSED
```

## Deployment

The current production deployment is available at:

https://snapops-vision.vercel.app

The source repository is:

https://github.com/Sreevalli20/snapdragon.git

The deployed application uses the Vite production build and SPA routing configuration.

## Competition Relevance

SnapOps Vision is designed around four important requirements:

### Technical Implementation

Real camera, OCR, computer vision, SOP validation, local persistence, evidence management, reporting, and provider-independent AI architecture.

### Application Use Case & Innovation

A unified AI-assisted industrial inspection workflow that combines perception, procedural verification, evidence collection, and reporting.

### Deployment & Accessibility

Browser-based deployment, local-first storage, fallback AI execution, and architecture prepared for Snapdragon-powered PC deployment.

### Presentation & Documentation

A complete working application, source repository, deployment URL, documented architecture, and reproducible development workflow.

## Project Status

### Working

- Real-time inspection workflow
- Camera integration
- Local computer vision
- OCR
- Speech integration
- SOP validation
- Evidence management
- Findings management
- Report generation
- IndexedDB persistence
- Offline/local workflow
- AI runtime abstraction
- Qualcomm AI integration boundary
- Vercel deployment

### Hardware-dependent

Physical Snapdragon NPU execution and hardware performance benchmarking require access to compatible Snapdragon hardware.

No hardware performance numbers are fabricated in this repository.

## Links

### Live Application

https://snapops-vision.vercel.app

### GitHub Repository

https://github.com/Sreevalli20/snapdragon.git

## License

Add the appropriate license only if one has actually been selected for the project. Do not invent a license.

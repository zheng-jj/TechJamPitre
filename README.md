# CoBridge

A comprehensive solution for automating geo-specific regulatory compliance checks using Large Language Models (LLMs) and Retrieval-Augmented Generation (RAG). This system addresses TikTok's challenge of proactively implementing legal guardrails before feature launches by turning regulatory detection from a blind spot into a traceable, auditable output.

## Problem Statement

As TikTok operates globally, every product feature must dynamically satisfy dozens of geographic regulations – from Brazil's data localization laws to GDPR compliance. The challenge is to build a prototype system that utilizes LLM capabilities to flag features that require geo-specific compliance logic, empowering TikTok to:

1. **Proactively implement legal guardrails** before feature launch
2. **Generate auditable evidence** proving features were screened for regional compliance needs
3. **Confidently respond** to regulatory inquiries with automated traceability

Without automated compliance checking, potential risks include:

- Legal exposure from undetected compliance gaps
- Reactive firefighting when auditors or regulators inquire
- Manual overhead in scaling global feature rollouts

## Solution Overview

Our system transforms regulatory compliance from reactive manual processes to proactive automated governance. The platform leverages advanced AI techniques to analyze documents against an extensive database, providing immediate feedback on potential compliance conflicts through bidirectional analysis.

### Key Features

- **Bidirectional Document Analysis**: Upload either law documents or feature documents for comprehensive compliance checking
- **Feature Impact Assessment**: When law documents are uploaded, identify existing features that may require modifications
- **Compliance Validation**: When feature documents are uploaded, flag potential conflicts with existing regulations
- **Comprehensive Reporting**: Generate detailed compliance reports with clear reasoning and evidence trails
- **Multi-Format Export**: Download reports as PDF, Excel, or view directly in the browser
- **Audit Trail Generation**: Maintain complete traceability for regulatory inquiries
- **Real-Time Processing**: Immediate analysis and feedback on uploaded documents

## How we built it

We architected CoBridge using a modern full-stack approach with AI at its core:

Frontend: Built with React.js, Tailwind CSS, ShadCN component library, Radix UI primitives, and Framer Motion for smooth animations, creating an intuitive interface for document upload and report visualization.

Backend: Implemented using FastAPI for high-performance Python APIs and Go services for efficient data processing, with MongoDB serving as our document database for compliance records and audit trails.

AI Pipeline: Integrated Gemini LLM for intelligent document parsing and analysis, FAISS vector store for semantic similarity searches, and RAG (Retrieval-Augmented Generation) for context-aware compliance analysis. The system converts documents to embeddings, performs similarity matching, and uses retrieved context to generate accurate compliance assessments.

Architecture: Designed a bidirectional analysis engine where each document type follows a specific processing flow – feature documents query the law database, while law documents query the feature database, enabling comprehensive cross-impact analysis.

## Challenges we ran into

Data Processing Complexity: Parsing diverse document formats (PDFs, Word docs, legal text) and extracting structured information required extensive preprocessing and robust error handling.

Embedding Quality: Achieving accurate semantic similarity between legal language and technical feature descriptions was challenging, requiring careful tuning of similarity thresholds and embedding models.

Bidirectional Logic: Implementing the dual-direction analysis (laws→features, features→laws) while maintaining data consistency and avoiding circular references required careful architectural planning.

Legal Accuracy: Ensuring the AI-generated compliance analysis was reliable enough for real-world regulatory scenarios while providing clear reasoning for each recommendation.

## Accomplishments that we're proud of

Bidirectional Intelligence: Successfully implemented a system that works both ways – analyzing features against laws AND laws against features, providing comprehensive compliance coverage that goes beyond traditional one-directional tools.

Production-Ready Architecture: Built a scalable system with proper separation of concerns, robust error handling, and audit trail capabilities suitable for enterprise deployment.

Intelligent Report Generation: Created a reporting system that generates professional, actionable compliance reports with detailed reasoning, making complex legal analysis accessible to product teams.

Seamless User Experience: Despite the complex AI backend, we maintained an intuitive interface where users simply upload documents and receive immediate, comprehensive analysis.

Real-World Applicability: Developed a solution that directly addresses TikTok's stated needs while being generalizable to any company operating across multiple jurisdictions.

## What we learned

AI-Legal Integration: Discovered the nuances of applying AI to legal compliance, including the importance of providing clear reasoning and maintaining audit trails for regulatory scrutiny.

Cross-Domain Analysis: Learned how to effectively bridge technical product documentation and legal regulatory language using advanced embedding techniques and RAG methodology.

Scalable AI Architecture: Gained insights into building AI systems that maintain performance while handling diverse document types and complex relational queries between different data domains.

User-Centered Compliance: Understood that successful compliance tools must balance comprehensive analysis with practical usability, ensuring that detailed legal insights translate into actionable guidance.

Regulatory Technology Gap: Recognized the significant opportunity in applying modern AI techniques to traditional compliance processes, where manual effort currently dominates.

## Architecture

### System Flow

![alt text](<Document Processing with RAG Sequence-1.png>)

#### Feature Document Upload Flow

1. **Document Upload**: Users upload feature artifact documents through the web interface
2. **Backend Processing**: Documents are sent to the backend server for initial processing
3. **LLM Parsing**: Feature documents are parsed through Gemini LLM to extract structured information
4. **Embedding Generation**: Parsed content is converted to embeddings for similarity matching
5. **Law Database Query**: FAISS vector store is queried for law documents exceeding similarity threshold
6. **RAG Processing**: Retrieved law documents serve as context for LLM analysis
7. **Compliance Analysis**: LLM identifies potential law violations and compliance requirements for the new feature
8. **Data Storage**: Results are stored in MongoDB and feature is added to feature database
9. **Report Generation**: Frontend generates compliance reports showing regulatory conflicts

#### Law Document Upload Flow

1. **Document Upload**: Users upload law or regulation documents through the web interface
2. **Backend Processing**: Law documents are sent to the backend server for processing
3. **LLM Parsing**: Law documents are parsed through Gemini LLM to extract regulatory requirements
4. **Embedding Generation**: Parsed legal content is converted to embeddings
5. **Feature Database Query**: FAISS vector store is queried for existing features that may be affected
6. **RAG Processing**: Retrieved feature documents serve as context for impact analysis
7. **Impact Analysis**: LLM identifies existing features that may need modification due to the new regulation
8. **Data Storage**: Law is added to the law database and analysis results stored in MongoDB
9. **Report Generation**: Frontend generates impact assessment reports showing affected features

### Technology Stack

#### Frontend

- **React.js**: Modern web application framework for responsive user interfaces
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **ShadCN**: Component library for consistent design patterns
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Animation library for enhanced user experience

#### Backend

- **FastAPI**: High-performance Python web framework for API development
- **Go**: Efficient backend services for data processing
- **MongoDB**: Document database for storing compliance data and audit trails

#### AI/ML Components

- **Gemini LLM**: Advanced language model for document parsing and compliance analysis
- **FAISS Vector Store**: Efficient similarity search for regulation and feature matching
- **RAG (Retrieval-Augmented Generation)**: Enhanced context-aware analysis
- **Embedding Models**: Document vectorization for semantic similarity

## Core Functionality

### RAG-Powered Bidirectional Analysis Engine

#### Law-to-Feature Analysis

- **Input**: New law or regulation document
- **Process**: RAG retrieval against comprehensive feature database
- **Output**: List of existing features that may require modification or review

#### Feature-to-Law Analysis

- **Input**: New feature documentation
- **Process**: RAG retrieval against existing law database
- **Output**: List of potentially applicable laws and compliance requirements

#### Intelligent Dataset Management

- **Duplicate Detection**: Identifies existing laws or features to prevent redundancy
- **Version Control**: Manages law updates and feature revisions
- **Automated Parsing**: Converts documents to standardized format with detailed labels
- **Cross-Reference Updates**: Maintains relationships between laws and affected features

### Data Management

#### Dual Storage Architecture

- **Vector Store (FAISS)**: Optimized for semantic similarity searches between laws and features
- **MongoDB**: Structured data storage for compliance records, audit trails, and document metadata

#### Dataset Categories

- **Laws Database**: Comprehensive collection of geo-specific regulations and legal requirements
- **Features Database**: Repository of product features with their compliance status and history

## Features and Capabilities

### Document Upload and Processing

- Support for multiple document formats (PDF, CSV, TXT)
- Automatic classification of document type (law vs feature)
- Intelligent parsing with structured output generation
- Real-time processing status updates

### Bidirectional Compliance Analysis

- **New Feature Analysis**: Identify regulatory requirements for proposed features
- **Regulatory Impact Assessment**: Determine which existing features are affected by new laws
- **Cross-Impact Visualization**: Show relationships between laws and features
- **Historical Compliance Tracking**: Maintain audit trail of all compliance decisions

### Compliance Report Generation

- **Browser Viewing**: Interactive web-based report interface
- **PDF Export**: Professional compliance reports for stakeholders
- **Excel Export**: Structured data for further analysis
- **Detailed Analysis**: Clear reasoning for each identified compliance requirement or feature impact

### Advanced Analytics

- Similarity threshold configuration for precision tuning
- Historical compliance trend analysis
- Risk assessment scoring for both features and regulations
- Geographic regulation mapping and feature impact zones

## Installation and Setup

### Prerequisites

- Node.js (v18 or higher)
- Python (v3.9 or higher)
- Go (v1.19 or higher)
- MongoDB instance
- Gemini API access

### Frontend Setup

```bash
# Clone the repository
git clone [[repository-url]](https://github.com/zheng-jj/TechJamPitre)
cd frontend/techjampitre

# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup

```bash
# Python FastAPI backend
cd dev_scripts

py -3 -m venv .venv
.\\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

uvicorn main:app --reload

# Go backend services
cd backend
go mod tidy
go run main.go
```

### Database Configuration

Launch Docker Desktop first before running the following commands

```bash

# Setup MongoDB in Docker container

docker run -d `
  --name mongodb `
  -p 27017:27017 `
  -v mongodb_data:/data/db `
  mongo:7.0

# Initialize vector store with law and feature databases
python scripts/init_vector_store.py
```

## Usage

### Basic Workflow

#### Uploading Feature Documents

1. **Feature Upload**

   - Navigate to the upload interface
   - Select "Feature Document" option
   - Upload feature artifact document (PRD, TRD, specifications)
   - System analyzes against existing law database

2. **Compliance Review**

   - Monitor real-time processing status
   - Review identified regulatory requirements
   - Examine detailed reasoning for each compliance flag
   - View geographic scope of applicable regulations

3. **Report Generation**
   - View comprehensive compliance report in browser
   - Export to PDF for stakeholder distribution
   - Download Excel format for compliance tracking

#### Uploading Law Documents

1. **Law Upload**

   - Navigate to the upload interface
   - Select "Law/Regulation Document" option
   - Upload legal document or regulation text
   - System analyzes impact on existing feature database

2. **Impact Assessment**

   - Review list of potentially affected features
   - Examine detailed analysis of required modifications
   - Assess priority and timeline for compliance updates
   - View feature-specific compliance gaps

3. **Action Planning**
   - Generate feature modification recommendations
   - Export impact assessment reports
   - Track compliance update progress

### Advanced Features

#### Dataset Management

- Add new regulations to the law database with automatic feature impact analysis
- Update existing feature classifications with regulatory compliance status
- Manage version control for both regulatory changes and feature updates
- Maintain cross-references between laws and affected features

#### Compliance Monitoring

- Set up automated compliance checking for new features against all regulations
- Configure notification systems for regulatory changes affecting existing features
- Maintain comprehensive audit logs for regulatory inquiries
- Track compliance status across all features and regulations

## Output Examples

The system generates comprehensive reports tailored to the document type uploaded:

### Feature Compliance Reports

- **Executive Summary**: Compliance status overview for the new feature
- **Regulatory Requirements**: Specific laws and regulations that apply
- **Geographic Compliance**: Regional requirements and restrictions
- **Implementation Guidance**: Actionable steps for compliance adherence
- **Risk Assessment**: Potential legal exposure levels

### Regulatory Impact Reports

- **Affected Features Summary**: List of features requiring review or modification
- **Impact Analysis**: Detailed breakdown of required changes per feature
- **Priority Assessment**: Risk-based prioritization of compliance updates
- **Timeline Recommendations**: Suggested implementation schedule
- **Resource Requirements**: Estimated effort for compliance updates

### Data Formats

- **Structured JSON**: For programmatic integration and automated workflows
- **Human-Readable PDF**: For stakeholder communication and documentation
- **Spreadsheet Format**: For detailed data analysis and project tracking

## Development Roadmap

### Current Capabilities

- Bidirectional document upload and parsing (laws and features)
- LLM-powered compliance analysis in both directions
- Multi-format report generation for different analysis types
- Vector-based similarity matching between laws and features
- Cross-impact relationship tracking

### Future Enhancements

- Multi-language document support for global regulations
- Real-time collaborative compliance review workflows
- Integration with external legal databases and regulatory feeds
- Automated compliance monitoring dashboards with alerts
- Machine learning model fine-tuning for specific regulatory domains
- Predictive compliance analysis for feature planning

## License

This project is developed for hackathon purposes and follows open-source principles for educational and research use.

## Team

This project was completed by: Zheng Jiongjie, Swah Jian Oon, Zeng Zihui, and Jarren San.

---

**Built for TikTok Geo-Compliance Automation Challenge 2025**

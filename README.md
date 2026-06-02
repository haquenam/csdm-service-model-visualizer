# CSDM Service Model Visualizer

A public, browser-based static web application for visualizing a simple ServiceNow Common Service Data Model (CSDM) service model from CSV data. The tool is intended for education, architecture review, governance workshops and lightweight data quality assessment.

> **Disclaimer:** This tool is for educational and architecture review purposes only. Do not upload confidential, customer, production, personal, regulated or sensitive data.

## Overview

CSDM Service Model Visualizer helps ServiceNow architects and enterprise architects quickly inspect whether application-to-service relationships are complete enough for architecture review discussions. It runs fully in the browser and does not require a backend, database, authentication layer or server-side processing.

The first working version includes:

- A professional enterprise architecture landing page.
- Browser-side CSV upload and parsing with PapaParse.
- Required CSDM column validation.
- A validation summary with readiness metrics.
- A parsed-records table.
- A React Flow relationship diagram showing:
  - Business Application → Service Instance → Technical Management Service → Technical Service Offering
- An executive summary panel with a CSDM readiness score.
- JSON and Markdown report exports.
- A sample CSV download button.
- GitHub Pages deployment workflow.

## Features

### CSV Upload and Parsing

Upload CSV files directly in the browser. The application validates the header row before generating records, metrics and diagrams.

### Required Columns

The uploaded CSV must include these exact column names:

```csv
business_application,service_instance,technical_management_service,technical_service_offering,application_owner,support_group,environment,criticality
```

### Validation Summary

The app reports:

- Total records
- Valid records
- Records missing owner
- Records missing support group
- Records missing service instance
- Records missing technical service offering
- Duplicate service instances

### CSDM Readiness Score

The readiness score is a lightweight architecture review indicator based on data completeness, service instance integrity, owner coverage, support group coverage and technical service offering alignment.

### Diagram

The model diagram uses React Flow to render a simple CSDM chain:

```text
Business Application → Service Instance → Technical Management Service → Technical Service Offering
```

### Exports

Export the current analysis as:

- JSON report
- Markdown report

## Sample CSV Structure

```csv
business_application,service_instance,technical_management_service,technical_service_offering,application_owner,support_group,environment,criticality
Customer Portal,Customer Portal - Production,Web Application Management,Managed Web Application - Gold,Avery Chen,Digital Experience Support,Production,High
Order Management,Order Management - Production,Commerce Platform Management,Commerce Platform - Platinum,Morgan Patel,Commerce Operations,Production,Critical
Employee Knowledge Base,Employee KB - UAT,Knowledge Platform Management,Knowledge Platform - Standard,Jordan Smith,IT Collaboration Services,UAT,Medium
```

The application also includes a **Download sample CSV** button on the landing page.

## Technology

This project is structured as a Vite-style React and TypeScript static web application and is configured with a GitHub Pages base path of `/csdm-service-model-visualizer/`.

Runtime libraries used by the public static app:

- React
- TypeScript
- Vite configuration
- Tailwind CSS
- PapaParse
- React Flow

The application is intentionally static: all parsing, validation, diagramming and exports happen client-side in the user's browser.

## Setup

From the repository root:

```bash
npm install
npm run build
```

The build output is written to `dist/`.

For a local static preview after building:

```bash
npm run preview
```

## Deployment to GitHub Pages

The repository includes `.github/workflows/deploy-pages.yml`, which:

1. Checks out the repository.
2. Sets up Node.js.
3. Runs `npm install`.
4. Runs `npm run build`.
5. Uploads `dist/` as the GitHub Pages artifact.
6. Deploys the artifact to GitHub Pages.

The Vite configuration uses:

```ts
base: '/csdm-service-model-visualizer/'
```

To deploy:

1. Enable GitHub Pages for the repository.
2. Set the Pages source to **GitHub Actions**.
3. Push to the `main` branch or run the workflow manually.
4. Open the published GitHub Pages URL when deployment completes.

## Roadmap

Potential future enhancements:

- Add richer CSDM entity types such as Application Service, Business Service and Business Service Offering.
- Add configurable validation rules and severity levels.
- Add CSV template variants for different CSDM maturity levels.
- Add filtering by owner, support group, criticality and environment.
- Add diagram clustering by application portfolio or business capability.
- Add offline bundled assets for environments that restrict CDN access.
- Add visual warnings for orphaned or incomplete relationship paths.
- Add optional anonymization helpers before analysis.

## Disclaimer

This tool is for educational and architecture review purposes only. Do not upload confidential, customer, production, personal, regulated or sensitive data.

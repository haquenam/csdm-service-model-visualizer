# CSDM Service Model Visualizer v2.1.0

This release follows the public v2.0 workbench with more precise CSDM modelling, better remediation continuity and fewer external dependencies.

## What's new

- **CSDM 5 labels clarified:** Technology Management Service Offering and Business Service Offering, with legacy v2.0 CSV field aliases preserved.
- **CSDM 5 relationship choice:** switch the Business Application connection between `Uses::Used by` and `Consumes::Consumed by`, with guidance for platform and Enterprise Architecture Workspace differences. CSDM 4 remains `Consumes::Consumed by`.
- **Object-specific ownership and support:** distinguish Service Instance and service-offering support groups/owners rather than flattening all responsibility into a single field; the old `support_group` column is still accepted as an offering-level fallback.
- **Cardinality advisory:** highlight a Service Instance linked to multiple Business Applications for review. Such a warning is not a definitive modelling failure.
- **Save/Resume Assessment:** export a versioned JSON session containing the source rows, version, relationship mode and remediation statuses, then restore it later without a backend.
- **Transparent scoring:** display the exact advisory readiness formula and a worked example.
- **Import preparation guidance:** help users prepare a relationship-oriented flat CSV from authorised ServiceNow exports.
- **Local runtime dependencies:** bundle React, React Flow, PapaParse, and Tailwind with the site rather than loading application libraries from third-party CDNs. A restrictive content-security policy is included.
- **Diagram refinements:** abbreviated interactive edge labels, longer headings wrapped in PNG exports and CSDM 4/5-specific Service Consumption captions.

## Compatibility and validation

Existing v2.0 CSV headers such as `technology_management_offering` and `business_offering` remain supported. In acceptance testing, an old sample imported all three rows and correctly generated a new Medium-severity cardinality warning rather than a duplicate-row finding.

The CSDM 4 and CSDM 5 sample assessments, relationship switching, remediation save/resume, invalid JSON handling, PNG and report exports, and locally bundled browser assets were reviewed during acceptance. GitHub Actions builds and automated regression tests completed successfully.

## Limitations and cautions

- One **structured flat CSV** is supported; native joins across multiple ServiceNow table exports are deferred to a future version.
- The readiness score and recommendations are advisory, not an official CSDM certification or import approval.
- Interactive graphs are limited to 120 nodes; filter the dataset to inspect more.
- Session status survives only when a JSON session is saved and later resumed; there is no database or account.
- Modelled relationship types vary by ServiceNow product and implementation. Select the appropriate compatibility option with practitioner judgement.
- Use only synthetic or appropriately anonymised data. Do not process confidential, personal, customer or regulated records.

**Live application:** https://haquenam.github.io/csdm-service-model-visualizer/  
**Import guidance:** https://github.com/haquenam/csdm-service-model-visualizer/blob/main/docs/IMPORT_PREPARATION.md  
**Repository:** https://github.com/haquenam/csdm-service-model-visualizer

Created by Enamul Haque. Independent, MIT-licensed educational tool, not affiliated with or endorsed by ServiceNow.

# CSDM Visualizer v2.0 — model contract and acceptance checks

Status: release-candidate development specification. v1.2 on main remains the public site until acceptance.

## Data contract

One row expresses a relationship traversal, not a unique service record. The four core entity columns are Business Application, Service Instance/Application Service, Technology Management Service/Technical Service and Technology Management Offering/Technical Service Offering. Business Service and Business Offering/Business Service Offering are optional consumer-domain columns. Owner, service owner, support group, environment and criticality are attributes. Per-entity sys_id columns disambiguate repeated names; when absent, case-insensitive names are an advisory identity only.

The version switch changes displayed CSDM terminology, expected template headers and BA-to-operational-service edge semantics. Imported legacy synonyms are normalised to canonical internal keys. It does not migrate ServiceNow instance metadata, reconfigure CMDB relationships or imply full platform compatibility.

## Relationship contract

| From | To | CSDM 4 | CSDM 5 | Kind |
| --- | --- | --- | --- | --- |
| Business Application | Application Service / Service Instance | Consumes::Consumed by | Uses::Used by | CMDB relationship |
| Technical / Technology Management Service | Technical / Technology Management Offering | parent service | parent service | Reference |
| Technical / Technology Management Offering | Application Service / Service Instance | Contains::Contained by | Contains::Contained by | CMDB relationship |
| Business Service | Business Service Offering / Business Offering | parent service | parent service | Reference |
| Business Offering | Application Service / Service Instance | Depends on::Used by | Depends on::Used by | CMDB relationship |

This model is intentionally scoped to a subset of the CSDM, not all tables, domains or prescribed relationships.

**Caveat:** ServiceNow's own documentation notes that Enterprise Architecture Workspace may still use the earlier Consumes::Consumed by relationship for some lifecycle functions under CSDM 5. We do not silently claim that the v2 Uses::Used by toggle is valid in every ServiceNow product context.

References:
- https://www.servicenow.com/docs/r/servicenow-platform/common-service-data-model-csdm/ci-relationships.html
- https://www.servicenow.com/community/common-service-data-model-forum/csdm-v4-to-v5-what-s-changed-for-the-technical-and-business/m-p/3362390
- https://www.servicenow.com/docs/r/pt-BR/servicenow-platform/common-service-data-model-csdm/manage-tech-servs-domain.html

## Readiness calculation

All findings have row-level evidence. High findings have weight 8, Medium 4, Low 2. Score is max(0, round(100 - 100 * sum(weighted findings)/(32 * number of rows))). This is an advisory signal only, not certified ServiceNow CSDM maturity or data quality. It can be influenced by the quality and scope of the input extract; missing optional consumer-domain records do not automatically count as a gap.

Exact row duplicates are flagged. Repeated service instances shared across distinct row relationships do not count as duplicates. Inconsistent parent references, identity conflicts and ambiguous names with different system IDs are checked separately.

## Acceptance checklist

- [x] Distinguish CSDM 4 and 5 terminology and BA relationship semantics in the model.
- [x] Interpret Technology/Technical Service -> Offering as a reference, not an inferred CMDB edge.
- [x] Accept legacy v1 flat extracts with supported aliases.
- [x] Recognise distinct relationships on repeated service instance names.
- [x] Inspect parent and owner conflicts and mandatory field gaps.
- [x] Deliver four graph views, filtering, PNG export and remediation outputs.
- [x] Cover pure model routines with unit tests.
- [ ] CI compile/test run completed successfully.
- [ ] Real-browser acceptance of CSV import, filters, exports, diagram and layout.
- [ ] Validate representative synthetic v4 and v5 extracts with domain SMEs.
- [ ] Explicit production merge and public release approval.

## Known limitations

- Single structured CSV import, including supported alias columns; no automatic import of multiple native ServiceNow tables or CMDB relation extracts.
- Diagram renders at most 120 unique nodes. Filters are required on larger datasets. PNG captures the current, possibly truncated graph.
- No backend, persistence, authentication or live ServiceNow API.
- Remediation statuses are editable in memory only; download before clearing or navigating away.
- Data safety: use synthetic or appropriately anonymised data only.

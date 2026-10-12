# Preparing CSDM data for the Visualizer

This is an **import preparation guide**, not a ServiceNow import-set specification. The Visualizer v2.1 accepts **one structured CSV** with a relationship traversal per row. It does **not** join native ServiceNow list exports from multiple tables or query a ServiceNow instance.

## 1. Choose a modelling standard

Select CSDM 4 or CSDM 5 before preparing a template. In CSDM 5 you may display either the documented default **Uses::Used by** or the compatibility **Consumes::Consumed by** for Business Application to Application Service / Service Instance relationships. Some ServiceNow features still rely on the older relationship; changing the selector changes *visualisation only*, not source records.

The CSDM 5 white paper uses Technology Management Service Offering and Business Service Offering. Shortened names and existing v2.0 CSV headers remain recognised as input aliases.

## 2. Export reference data from ServiceNow

For a proof of concept, export suitably anonymised data from authorised environments. Candidate datasets generally include:

| Information | Illustrative ServiceNow source | Needed for |
| --- | --- | --- |
| Business Application | Business Application records | Application name, owner, stable sys_id |
| Application Service / Service Instance | Operational application service records | Instance name, support attributes, sys_id |
| Technology Management Service | Technical service records | Parent service and service attributes |
| Technology Management Service Offering | Service offering records | Offering and offering-specific support group |
| Business Service and its Offering | Business service and offering records | Sell/Consume perspective |
| CI relationship records | CMDB relationship exports | Identifying related Application Services and Business Applications |

Exact tables, class inheritance, relationship direction and available attributes depend on your ServiceNow release, plugins and configuration. **Never assume equal display names identify the same record. Prefer sys_id and verify the relationship type in source exports.**

## 3. Prepare a joined, flattened review extract

The Visualizer works with *one row per path/relationship combination*. A Service Instance may occur on multiple rows if different legitimate relationships are represented. Repeated rows with **identical fields** are counted as duplicate input records.

Required core entity fields (CSDM 5 template):

- business_application
- service_instance
- technology_management_service
- technology_management_service_offering

Required core entity fields (CSDM 4 template):

- business_application
- application_service
- technical_service
- technical_service_offering

The template also supports:

- business_service and business_service_offering (optional consumer domain)
- application_owner and service_owner
- service_instance_owner, service_instance_support_group
- technology_management_service_owner
- technology_management_offering_owner, technology_management_offering_support_group
- business_offering_owner and business_offering_support_group
- environment and criticality
- business_application_sys_id, service_instance_sys_id, technology_management_service_sys_id, technology_management_offering_sys_id, business_service_sys_id, business_offering_sys_id

**Legacy:** The old generic support_group is treated as an offering-level fallback. It does not establish an instance support group, because those are separate object attributes. Existing v1 and v2.0 headers including technology_management_offering and business_offering are supported.

The *column header* used in the CSV need not be the exact ServiceNow database table label. Use the downloadable application template as the import contract.

## 4. Validate before analysis

1. Check that the same sys_id does not represent different display names, unless an intentional rename is being reviewed.
2. Check that a single Service Instance is associated with its intended Business Application; multiple application mappings are raised for review, not automatically rejected.
3. Keep offering owner/support groups separate from instance owner/support groups. Different teams are legitimate.
4. Avoid joining across records by display name alone.
5. Keep a record of how source table identifiers and relationship types were combined.
6. Use only synthetic or appropriately anonymised records in this public browser application.

## 5. Review and export

Upload the flattened CSV, choose the CSDM version and relationship label, and click **Run analysis**. Inspect both the identified findings and the actual graph. The readiness indicator is advisory and assumes that your input extract contains the relevant relationships. Export your remediation CSV or save a **CSDM v2.1 assessment session JSON**, which retains the source extract, selected relationship mode, and edited remediation statuses.

Do not treat a high score as CSDM certification or approval to import data into ServiceNow.

## Planned next step: native ServiceNow exports (v2.2)

The future native import adapter should accept multiple list exports, validate source table schemas, join entities using sys_id, read relationships with their explicit types and directions, preserve per-object attributes, and explain ambiguities before producing a canonical graph. This is a separate architecture and acceptance workstream.

## ServiceNow guidance

- [Required CSDM CI relationships](https://www.servicenow.com/docs/r/zurich/servicenow-platform/common-service-data-model-csdm/ci-relationships.html)
- [CSDM 5 white paper](https://www.servicenow.com/community/s/cgfwn76974/attachments/cgfwn76974/common-service-data-model-kb/744/3/CSDM%205%20w%20links.pdf)

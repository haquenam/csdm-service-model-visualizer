// CSDM Visualizer v2.0 canonical, browser-only analysis model.
// Uses stable IDs where supplied, and never treats repeated valid references as duplicates.
export type CsdmVersion = '4' | '5';
export type ModelView = 'all' | 'application' | 'delivery' | 'consumption';
export type Severity = 'High' | 'Medium' | 'Low';
export type EntityKind = 'business_application' | 'service_instance' | 'technology_management_service' |
  'technology_management_offering' | 'business_service' | 'business_offering';
export type RecordKey = EntityKind | 'application_owner' | 'service_owner' | 'support_group' |
  'environment' | 'criticality' | 'business_application_sys_id' | 'service_instance_sys_id' |
  'technology_management_service_sys_id' | 'technology_management_offering_sys_id' |
  'business_service_sys_id' | 'business_offering_sys_id';
export type CsdmRecord = Record<RecordKey, string>;
export type Finding = {
  id: string; code: string; severity: Severity; row: number; businessApplication: string; entity: string;
  currentValue: string; recommendation: string; status: 'Open' | 'In progress' | 'Resolved';
};
export type Analysis = {
  total: number; valid: number; score: number; findings: Finding[];
  counts: Record<Severity, number>; duplicates: number;
};
export type GraphNode = {
  id: string; kind: EntityKind; label: string; x: number; y: number;
};
export type GraphEdge = { id: string; source: string; target: string; label: string; relationType: 'CMDB' | 'Reference' };
export type Graph = { nodes: GraphNode[]; edges: GraphEdge[]; truncated: boolean; totalNodes: number };
export const ENTITY_FIELDS: EntityKind[] = [
  'business_application', 'service_instance', 'technology_management_service',
  'technology_management_offering', 'business_service', 'business_offering',
];
export const CORE_FIELDS: EntityKind[] = [
  'business_application', 'service_instance', 'technology_management_service', 'technology_management_offering',
];
export const FIELDS: RecordKey[] = [
  ...ENTITY_FIELDS, 'application_owner', 'service_owner', 'support_group', 'environment', 'criticality',
  'business_application_sys_id', 'service_instance_sys_id',
  'technology_management_service_sys_id', 'technology_management_offering_sys_id',
  'business_service_sys_id', 'business_offering_sys_id',
];
const IDS: Record<EntityKind, RecordKey> = {
  business_application: 'business_application_sys_id',
  service_instance: 'service_instance_sys_id',
  technology_management_service: 'technology_management_service_sys_id',
  technology_management_offering: 'technology_management_offering_sys_id',
  business_service: 'business_service_sys_id',
  business_offering: 'business_offering_sys_id',
};
export const LABELS: Record<CsdmVersion, Record<EntityKind, string>> = {
  '4': {
    business_application: 'Business Application', service_instance: 'Application Service',
    technology_management_service: 'Technical Service', technology_management_offering: 'Technical Service Offering',
    business_service: 'Business Service', business_offering: 'Business Service Offering',
  },
  '5': {
    business_application: 'Business Application', service_instance: 'Service Instance',
    technology_management_service: 'Technology Management Service', technology_management_offering: 'Technology Management Offering',
    business_service: 'Business Service', business_offering: 'Business Offering',
  },
};
export const HEADERS: Record<CsdmVersion, Record<EntityKind, string>> = {
  '4': {
    business_application: 'business_application', service_instance: 'application_service',
    technology_management_service: 'technical_service', technology_management_offering: 'technical_service_offering',
    business_service: 'business_service', business_offering: 'business_service_offering',
  },
  '5': {
    business_application: 'business_application', service_instance: 'service_instance',
    technology_management_service: 'technology_management_service', technology_management_offering: 'technology_management_offering',
    business_service: 'business_service', business_offering: 'business_offering',
  },
};
const ALIASES: Record<EntityKind, string[]> = {
  business_application: ['business_application', 'business_app', 'business_application_name'],
  service_instance: ['service_instance', 'application_service', 'application_service_name'],
  technology_management_service: ['technology_management_service', 'technical_service', 'technical_management_service'],
  technology_management_offering: ['technology_management_offering', 'technical_service_offering', 'technical_management_offering'],
  business_service: ['business_service'],
  business_offering: ['business_offering', 'business_service_offering'],
};
export const normal = (value: unknown): string => String(value ?? '').trim();
const key = (value: string): string => normal(value).toLocaleLowerCase('en');
export const formatCsvCell = (value: unknown): string => {
  let text = normal(value);
  if (/^[=+@\-\t\r]/.test(text)) text = "'" + text; // spreadsheet formula injection defence
  return /[",\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
};
export const emptyRecord = (): CsdmRecord =>
  Object.fromEntries(FIELDS.map((field) => [field, ''])) as CsdmRecord;
export const expectedHeaders = (version: CsdmVersion): string[] =>
  FIELDS.map((field) => (field in HEADERS[version] ? HEADERS[version][field as EntityKind] : field));
export const standardSample = (): CsdmRecord[] => {
  const first = { ...emptyRecord(), business_application: 'Customer Portal', service_instance: 'Customer Portal Production',
    technology_management_service: 'Web Platform Management', technology_management_offering: 'Web Application Gold',
    business_service: 'Digital Customer Services', business_offering: 'Customer Portal Access',
    application_owner: 'Alex Example', service_owner: 'Morgan Example', support_group: 'Digital Operations',
    environment: 'Production', criticality: 'High' };
  const second = { ...first, business_application: 'Customer Ordering', application_owner: 'Jordan Example' };
  const third = { ...emptyRecord(), business_application: 'Employee Knowledge', service_instance: 'Knowledge UAT',
    technology_management_service: 'Collaboration Management', technology_management_offering: 'Knowledge Standard',
    application_owner: 'Sam Example', support_group: 'Collaboration Support', environment: 'UAT', criticality: 'Medium' };
  return [first, second, third];
};
export const toCsv = (rows: CsdmRecord[], version: CsdmVersion): string => {
  const headers = expectedHeaders(version);
  return [headers.join(','), ...rows.map((row) => FIELDS.map((field) => formatCsvCell(row[field])).join(','))].join('\r\n');
};
export const parseRows = (rows: Record<string, unknown>[], rawHeaders: string[], version: CsdmVersion): CsdmRecord[] => {
  const headers = rawHeaders.map((name) => normal(name).replace(/^\uFEFF/, ''));
  const available = new Set(headers);
  const columnFor: Partial<Record<RecordKey, string>> = {};
  ENTITY_FIELDS.forEach((field) => {
    const order = [HEADERS[version][field], ...ALIASES[field]];
    columnFor[field] = order.find((name) => available.has(name));
  });
  FIELDS.filter((field) => !ENTITY_FIELDS.includes(field as EntityKind)).forEach((field) => {
    if (available.has(field)) columnFor[field] = field;
  });
  const found = CORE_FIELDS.filter((field) => columnFor[field]);
  if (found.length < 2 || !columnFor.business_application || !columnFor.service_instance) {
    throw new Error('Cannot map the file. At minimum, include business_application and ' +
      HEADERS[version].service_instance + ' (or a supported equivalent). Use the sample template.');
  }
  return rows.map((raw) => {
    const record = emptyRecord();
    FIELDS.forEach((field) => {
      const column = columnFor[field];
      if (column) record[field] = normal(raw[column]);
    });
    return record;
  });
};
export const entityId = (row: CsdmRecord, kind: EntityKind): string => {
  const stableId = key(row[IDS[kind]]);
  const name = key(row[kind]);
  return stableId ? kind + ':id:' + stableId : name ? kind + ':name:' + name : '';
};
export const relationships = (version: CsdmVersion): {
  from: EntityKind; to: EntityKind; name: string; relationType: 'CMDB' | 'Reference'
}[] => [
  { from: 'business_application', to: 'service_instance',
    name: version === '5' ? 'Uses::Used by' : 'Consumes::Consumed by', relationType: 'CMDB' },
  { from: 'technology_management_service', to: 'technology_management_offering',
    name: 'Parent service (reference)', relationType: 'Reference' },
  { from: 'technology_management_offering', to: 'service_instance',
    name: 'Contains::Contained by', relationType: 'CMDB' },
  { from: 'business_service', to: 'business_offering',
    name: 'Parent service (reference)', relationType: 'Reference' },
  { from: 'business_offering', to: 'service_instance',
    name: 'Depends on::Used by', relationType: 'CMDB' },
];
const guidance: Record<string, { severity: Severity; action: string }> = {
  missing_business_application: { severity: 'High', action: 'Map this record to the correct Business Application.' },
  missing_service_instance: { severity: 'High', action: 'Identify the operational instance and verify its relationship with the Business Application.' },
  missing_technology_management_service: { severity: 'Medium', action: 'Identify the parent Technology Management Service (or Technical Service in CSDM 4).' },
  missing_technology_management_offering: { severity: 'Medium', action: 'Identify the management offering supporting this instance.' },
  missing_application_owner: { severity: 'Low', action: 'Confirm the accountable Business Application owner.' },
  missing_support_group: { severity: 'Medium', action: 'Assign the operational support group at the applicable offering or CI.' },
  missing_business_service: { severity: 'Medium', action: 'Business Offering exists without its parent Business Service.' },
  exact_duplicate_row: { severity: 'Medium', action: 'Remove duplicate imported rows; repeated references across different relationships are valid.' },
  conflicting_identity: { severity: 'High', action: 'Review the same sys_id with inconsistent names; confirm the authoritative CI identity.' },
  conflicting_parent: { severity: 'High', action: 'An offering maps to multiple parents; verify the offering parent reference.' },
  conflicting_owner: { severity: 'Medium', action: 'The same Business Application has different owners in the import; confirm the authoritative owner.' },
  ambiguous_name: { severity: 'Medium', action: 'The same displayed name has different sys_ids; inspect the distinct records, do not merge by name.' },
};
export const analyse = (records: CsdmRecord[], version: CsdmVersion): Analysis => {
  const findings: Finding[] = [];
  const seenRows = new Map<string, number>();
  const ids = new Map<string, { name: string; row: number }>();
  const names = new Map<string, Set<string>>();
  const parents = new Map<string, string>();
  const owners = new Map<string, string>();
  const add = (code: string, row: number, entity: string, currentValue: string): void => {
    const rule = guidance[code];
    findings.push({ id: code + ':' + row + ':' + findings.length, code, severity: rule.severity, row,
      businessApplication: records[row - 2]?.business_application || '', entity, currentValue,
      recommendation: rule.action, status: 'Open' });
  };
  records.forEach((record, index) => {
    const row = index + 2; // spreadsheet row including header
    CORE_FIELDS.forEach((field) => {
      if (!normal(record[field])) add('missing_' + field, row, LABELS[version][field], '(blank)');
    });
    if (!normal(record.application_owner)) add('missing_application_owner', row, record.business_application, '(blank)');
    if (!normal(record.support_group)) add('missing_support_group', row, record.technology_management_offering, '(blank)');
    if (normal(record.business_offering) && !normal(record.business_service)) {
      add('missing_business_service', row, record.business_offering, '(blank)');
    }
    const fingerprint = FIELDS.map((field) => key(record[field])).join('\u001f');
    if (seenRows.has(fingerprint)) {
      add('exact_duplicate_row', row, record.service_instance, 'Matches row ' + seenRows.get(fingerprint));
    } else seenRows.set(fingerprint, row);
    ENTITY_FIELDS.forEach((kind) => {
      const name = key(record[kind]);
      const id = key(record[IDS[kind]]);
      if (!name) return;
      const token = kind + ':' + id;
      if (id) {
        const previously = ids.get(token);
        if (previously && previously.name !== name) {
          add('conflicting_identity', row, record[kind], 'Same sys_id as row ' + previously.row);
        } else if (!previously) ids.set(token, { name, row });
        const nameToken = kind + ':' + name;
        const knownIds = names.get(nameToken) ?? new Set<string>();
        if (knownIds.size && !knownIds.has(id)) add('ambiguous_name', row, record[kind], 'Several sys_ids share this name');
        knownIds.add(id);
        names.set(nameToken, knownIds);
      }
    });
    for (const [offering, parent] of [
      ['technology_management_offering', 'technology_management_service'],
      ['business_offering', 'business_service'],
    ] as [EntityKind, EntityKind][]) {
      const childId = entityId(record, offering);
      const parentId = entityId(record, parent);
      if (!childId || !parentId) continue;
      const oldParent = parents.get(childId);
      if (oldParent && oldParent !== parentId) {
        add('conflicting_parent', row, record[offering], 'Different parent for the same offering');
      } else parents.set(childId, parentId);
    }
    const businessAppId = entityId(record, 'business_application');
    if (businessAppId && normal(record.application_owner)) {
      const previous = owners.get(businessAppId);
      if (previous && previous !== key(record.application_owner)) {
        add('conflicting_owner', row, record.business_application, 'More than one owner for same Business Application');
      } else owners.set(businessAppId, key(record.application_owner));
    }
  });
  const order: Record<Severity, number> = { High: 0, Medium: 1, Low: 2 };
  findings.sort((a, b) => order[a.severity] - order[b.severity] || a.row - b.row);
  const counts = { High: 0, Medium: 0, Low: 0 };
  findings.forEach((finding) => { counts[finding.severity]++; });
  const weightedIssues = counts.High * 8 + counts.Medium * 4 + counts.Low * 2;
  // Transparent advisory score: 100 minus weighted penalties over 4 core rules per record.
  const score = records.length ? Math.max(0, Math.round(100 - 100 * weightedIssues / (records.length * 32))) : 0;
  return { total: records.length, valid: records.filter((record) => CORE_FIELDS.every((field) => normal(record[field]))).length,
    score, findings, counts, duplicates: findings.filter((f) => f.code === 'exact_duplicate_row').length };
};
const POSITION: Record<EntityKind, number> = {
  business_application: 0, service_instance: 340, technology_management_offering: 680,
  technology_management_service: 1020, business_offering: 680, business_service: 1020,
};
export const createGraph = (records: CsdmRecord[], version: CsdmVersion, view: ModelView, limit = 120): Graph => {
  const visible: EntityKind[] = view === 'application'
    ? ['business_application', 'service_instance']
    : view === 'delivery' ? ['service_instance', 'technology_management_offering', 'technology_management_service']
      : view === 'consumption' ? ['service_instance', 'business_offering', 'business_service'] : ENTITY_FIELDS;
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();
  const rowsByKind = new Map<EntityKind, number>();
  const relations = relationships(version);
  // Position the optional consumer branch immediately after the populated core rows.
  // The previous fixed 640px offset produced a large empty band in small diagrams.
  const coreKinds: EntityKind[] = ['business_application', 'service_instance', 'technology_management_offering', 'technology_management_service'];
  const coreDepth = Math.max(1, ...coreKinds.map((kind) =>
    new Set(records.map((record) => entityId(record, kind)).filter(Boolean)).size));
  const consumptionOffset = (coreDepth + 0.25) * 114;
  records.forEach((record) => {
    visible.forEach((kind) => {
      const id = entityId(record, kind);
      if (!id || nodes.has(id)) return;
      const row = rowsByKind.get(kind) ?? 0;
      rowsByKind.set(kind, row + 1);
      const yOffset = view === 'all' && (kind === 'business_service' || kind === 'business_offering') ? consumptionOffset : 0;
      nodes.set(id, { id, kind, label: record[kind], x: POSITION[kind], y: 50 + yOffset + row * 114 });
    });
    relations.forEach((relation) => {
      if (!visible.includes(relation.from) || !visible.includes(relation.to)) return;
      const source = entityId(record, relation.from);
      const target = entityId(record, relation.to);
      if (!source || !target) return;
      const id = source + '::' + target + '::' + relation.name;
      if (!edges.has(id)) edges.set(id, { id, source, target, label: relation.name, relationType: relation.relationType });
    });
  });
  const selectedNodes = Array.from(nodes.values()).slice(0, limit);
  const selected = new Set(selectedNodes.map((node) => node.id));
  return { nodes: selectedNodes, edges: Array.from(edges.values()).filter((edge) => selected.has(edge.source) && selected.has(edge.target)),
    truncated: nodes.size > limit, totalNodes: nodes.size };
};
/** Prepare an export-only graph. In the end-to-end view, consumer relationships
 * sit in a separate lane with intentionally repeated Service Instance cards.
 * This avoids a misleading long crossing through Technology Management Offering
 * relationships in the main graph. These are repeated representations, not new CIs. */
export const preparePngGraph = (graph: Graph, view: ModelView): {
  graph: Graph; consumerSectionY: number | null
} => {
  if (view !== 'all') return { graph, consumerSectionY: null };
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const consumerKinds = new Set<EntityKind>(['business_service', 'business_offering']);
  const coreNodes = graph.nodes.filter((node) => !consumerKinds.has(node.kind));
  const coreEdges = graph.edges.filter((edge) =>
    !consumerKinds.has(byId.get(edge.source)?.kind as EntityKind) &&
    !consumerKinds.has(byId.get(edge.target)?.kind as EntityKind));
  const links = graph.edges.filter((edge) =>
    byId.get(edge.source)?.kind === 'business_offering' && byId.get(edge.target)?.kind === 'service_instance');
  if (!links.length) {
    // Retain orphaned consumer nodes for inspection when no consumer link exists.
    return { graph, consumerSectionY: null };
  }
  const coreBottom = Math.max(50, ...coreNodes.map((node) => node.y));
  const consumerSectionY = coreBottom + 180;
  const extraNodes: GraphNode[] = [];
  const extraEdges: GraphEdge[] = [];
  const usedOfferingIds = new Set<string>();
  links.forEach((link, index) => {
    const offering = byId.get(link.source);
    const instance = byId.get(link.target);
    if (!offering || !instance) return;
    const y = consumerSectionY + index * 124;
    const instId = 'png-consumer-instance:' + index;
    const offerId = 'png-consumer-offering:' + index;
    usedOfferingIds.add(offering.id);
    extraNodes.push({ ...instance, id: instId, x: 340, y });
    extraNodes.push({ ...offering, id: offerId, x: 680, y });
    extraEdges.push({ ...link, id: 'png-consumer-link:' + index, source: offerId, target: instId });
    graph.edges.filter((edge) => edge.target === offering.id &&
      byId.get(edge.source)?.kind === 'business_service').forEach((parentEdge, parentIndex) => {
      const service = byId.get(parentEdge.source);
      if (!service) return;
      const serviceId = 'png-consumer-service:' + index + ':' + parentIndex;
      extraNodes.push({ ...service, id: serviceId, x: 1020, y });
      extraEdges.push({ ...parentEdge, id: 'png-parent:' + index + ':' + parentIndex,
        source: serviceId, target: offerId });
    });
  });
  const orphaned = graph.nodes.filter((node) =>
    node.kind === 'business_offering' && !usedOfferingIds.has(node.id));
  orphaned.forEach((offering, index) => {
    const row = links.length + index;
    const y = consumerSectionY + row * 124;
    const offerId = 'png-orphan-offering:' + index;
    extraNodes.push({ ...offering, id: offerId, x: 680, y });
    graph.edges.filter((edge) => edge.target === offering.id &&
      byId.get(edge.source)?.kind === 'business_service').forEach((parentEdge, parentIndex) => {
      const service = byId.get(parentEdge.source);
      if (!service) return;
      const serviceId = 'png-orphan-service:' + index + ':' + parentIndex;
      extraNodes.push({ ...service, id: serviceId, x: 1020, y });
      extraEdges.push({ ...parentEdge, id: 'png-orphan-parent:' + index + ':' + parentIndex,
        source: serviceId, target: offerId });
    });
  });
  return {
    graph: { ...graph, nodes: [...coreNodes, ...extraNodes], edges: [...coreEdges, ...extraEdges],
      totalNodes: coreNodes.length + extraNodes.length },
    consumerSectionY,
  };
};

export type PngEdgeRoute = {
  startX: number; startY: number; endX: number; endY: number; laneX: number;
};
/** Routes each unrelated relationship through its own horizontal gutter channel.
 * Using one shared midpoint made two different edges look like a false join. */
export const calculatePngRoutes = (graph: Graph): Map<string, PngEdgeRoute> => {
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const groups = new Map<string, { id: string; route: PngEdgeRoute }[]>();
  graph.edges.forEach((edge) => {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    if (!source || !target || source.x === target.x) return;
    const toRight = source.x < target.x;
    const startX = source.x + (toRight ? 246 : 10);
    const endX = target.x + (toRight ? 10 : 246);
    const left = Math.min(startX, endX);
    const right = Math.max(startX, endX);
    const key = left + ':' + right;
    const group = groups.get(key) ?? [];
    group.push({ id: edge.id, route: {
      startX, endX, startY: source.y + 37, endY: target.y + 37,
      laneX: (startX + endX) / 2,
    } });
    groups.set(key, group);
  });
  const routes = new Map<string, PngEdgeRoute>();
  groups.forEach((group) => {
    group.sort((a, b) => a.route.startY - b.route.startY ||
      a.route.endY - b.route.endY || a.id.localeCompare(b.id));
    group.forEach((item, index) => {
      const left = Math.min(item.route.startX, item.route.endX);
      const right = Math.max(item.route.startX, item.route.endX);
      const margin = 8;
      const usable = Math.max(8, right - left - margin * 2);
      const laneX = left + margin + usable * ((index + 1) / (group.length + 1));
      routes.set(item.id, { ...item.route, laneX });
    });
  });
  return routes;
};

export const remediationCsv = (findings: Finding[]): string => [
  'business_application,row,issue_type,severity,entity,current_value,recommended_action,remediation_status',
  ...findings.map((f) => [f.businessApplication, f.row, f.code, f.severity, f.entity, f.currentValue, f.recommendation, f.status]
    .map(formatCsvCell).join(',')),
].join('\r\n');
export const reportMarkdown = (analysis: Analysis, version: CsdmVersion): string => [
  '# CSDM Visualizer v2.0 assessment', '',
  'CSDM version: ' + version, 'Records: ' + analysis.total, 'Core-complete rows: ' + analysis.valid,
  'Indicative readiness score: ' + analysis.score + '%', 'Findings: ' + analysis.findings.length, '',
  'Scoring method: 100 minus weighted findings (High 8, Medium 4, Low 2) divided by 32 per row.',
  'This score is advisory and not a CSDM certification.', '',
  '| Business Application | Row | Finding | Severity | Entity | Recommendation | Status |',
  '| --- | --- | --- | --- | --- | --- | --- |',
  ...analysis.findings.map((f) => [f.businessApplication, f.row, f.code, f.severity, f.entity, f.recommendation, f.status]
    .map((cell) => normal(cell).replace(/\|/g, '\\|').replace(/\n/g, ' ')).join(' | '))
    .map((line) => '| ' + line + ' |'),
  '', 'This tool is for educational review with synthetic or anonymised data only.',
].join('\n');

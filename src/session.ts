import {
  type CsdmRecord, type CsdmVersion, type Finding, type RelationshipMode, FIELDS, analyse,
} from './model.js';

export const SESSION_FORMAT = 'csdm-visualizer-assessment';
export const SESSION_VERSION = 1;
export const MAX_SESSION_BYTES = 5_000_000;
export const MAX_SESSION_ROWS = 5000;
export type Session = {
  format: typeof SESSION_FORMAT;
  formatVersion: number;
  csdmVersion: CsdmVersion;
  relationshipMode: RelationshipMode;
  exportedAt: string;
  records: CsdmRecord[];
  statuses: Record<string, Finding['status']>;
};
export const findingKey = (f: Pick<Finding, 'row' | 'code' | 'entity' | 'currentValue'>): string =>
  [f.row, f.code, f.entity, f.currentValue].join('\u001f');

export const buildSession = (version: CsdmVersion, mode: RelationshipMode, records: CsdmRecord[],
  findings: Finding[]): Session => ({
  format: SESSION_FORMAT,
  formatVersion: SESSION_VERSION,
  csdmVersion: version,
  relationshipMode: version === '4' ? 'consumes' : mode,
  exportedAt: new Date().toISOString(),
  records,
  statuses: Object.fromEntries(findings.filter((finding) => finding.status !== 'Open')
    .map((finding) => [findingKey(finding), finding.status])),
});

const plainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
export const readSession = (jsonText: string): {
  version: CsdmVersion;
  mode: RelationshipMode;
  records: CsdmRecord[];
  statuses: Record<string, Finding['status']>;
} => {
  if (jsonText.length > MAX_SESSION_BYTES) throw new Error('Assessment exceeds the 5 MB safety limit.');
  let decoded: unknown;
  try { decoded = JSON.parse(jsonText); } catch { throw new Error('Assessment JSON is not valid.'); }
  if (!plainObject(decoded) || decoded.format !== SESSION_FORMAT ||
      decoded.formatVersion !== SESSION_VERSION) {
    throw new Error('This is not a supported CSDM v2.1 assessment session file.');
  }
  const version = decoded.csdmVersion;
  if (version !== '4' && version !== '5') throw new Error('Assessment has an invalid CSDM version.');
  const mode = decoded.relationshipMode;
  if (mode !== 'uses' && mode !== 'consumes') throw new Error('Assessment has an invalid relationship mode.');
  if (!Array.isArray(decoded.records) || !decoded.records.length || decoded.records.length > MAX_SESSION_ROWS) {
    throw new Error('Assessment must contain between 1 and 5,000 rows.');
  }
  const records: CsdmRecord[] = decoded.records.map((record: unknown, index: number) => {
    if (!plainObject(record)) throw new Error('Invalid record at row ' + (index + 2) + '.');
    const row = Object.fromEntries(FIELDS.map((key) => {
      const value = record[key] ?? '';
      if (typeof value !== 'string') throw new Error('Invalid value for ' + key + ' at row ' + (index + 2) + '.');
      return [key, value];
    })) as CsdmRecord;
    return row;
  });
  const validFindings = analyse(records, version).findings;
  const allowed = new Set(validFindings.map(findingKey));
  const raw = decoded.statuses;
  if (raw !== undefined && !plainObject(raw)) throw new Error('Assessment contains invalid remediation statuses.');
  const statuses: Record<string, Finding['status']> = {};
  if (plainObject(raw)) {
    Object.entries(raw).forEach(([id, status]) => {
      if (allowed.has(id) && (status === 'Open' || status === 'In progress' || status === 'Resolved')) {
        statuses[id] = status;
      }
    });
  }
  return { version, mode: version === '4' ? 'consumes' : mode, records, statuses };
};

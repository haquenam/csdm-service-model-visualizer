import {
  type CsdmVersion, type ModelView, type CsdmRecord, type Finding, type Graph, type EntityKind,
  FIELDS, CORE_FIELDS, ENTITY_FIELDS, LABELS, expectedHeaders, standardSample, toCsv,
  parseRows, analyse, createGraph, remediationCsv, reportMarkdown, normal,
} from './model.js';
declare const React: any;
declare const ReactDOM: any;
declare const Papa: any;
declare const ReactFlow: any;
const h = React.createElement;
const { useMemo, useState } = React;
const { ReactFlow: FlowCanvas, Background, Controls, MiniMap, Handle, Position, MarkerType } = ReactFlow;
const chip = 'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold';
const button = 'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40';
const primary = 'rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40';
const selectStyle = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800';
const box = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
const format = (name: string) => name.replace(/_/g, ' ');
const exportText = (filename: string, value: string, type: string) => {
  const blob = new Blob([value], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
};
const svgElement = (name: string) => document.createElementNS('http://www.w3.org/2000/svg', name);
const pngExport = (graph: Graph, version: CsdmVersion, onError: (message: string) => void) => {
  if (!graph.nodes.length) return;
  const width = 1300;
  const height = Math.min(12000, Math.max(340, ...graph.nodes.map((n) => n.y + 135)));
  const svg = svgElement('svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
  const addRect = (x: number, y: number, w: number, hh: number, fill: string, stroke: string) => {
    const rect = svgElement('rect');
    for (const [key, value] of Object.entries({ x, y, width: w, height: hh, rx: 9, fill, stroke })) rect.setAttribute(key, String(value));
    svg.appendChild(rect);
  };
  addRect(0, 0, width, height, '#ffffff', '#ffffff');
  const index = new Map(graph.nodes.map((n) => [n.id, n]));
  graph.edges.forEach((edge) => {
    const source = index.get(edge.source);
    const target = index.get(edge.target);
    if (!source || !target) return;
    const line = svgElement('line');
    const left = source.x <= target.x;
    for (const [key, value] of Object.entries({
      x1: source.x + (left ? 240 : 0), y1: source.y + 30,
      x2: target.x + (left ? 0 : 240), y2: target.y + 30,
      stroke: edge.relationType === 'Reference' ? '#94a3b8' : '#2563eb',
      'stroke-width': 2, 'stroke-dasharray': edge.relationType === 'Reference' ? '5 5' : 'none',
    })) line.setAttribute(key, String(value));
    svg.appendChild(line);
    const label = svgElement('text');
    label.setAttribute('x', String((source.x + target.x + 240) / 2));
    label.setAttribute('y', String((source.y + target.y) / 2 + 22));
    label.setAttribute('font-size', '10');
    label.setAttribute('font-family', 'Arial, sans-serif');
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', '#334155');
    label.setAttribute('stroke', '#ffffff');
    label.setAttribute('stroke-width', '3');
    label.setAttribute('paint-order', 'stroke');
    label.textContent = edge.label;
    svg.appendChild(label);
  });
  graph.nodes.forEach((node) => {
    addRect(node.x + 10, node.y + 2, 236, 70, node.kind === 'service_instance' ? '#e0f2fe' : '#f8fafc', '#94a3b8');
    const text = svgElement('text');
    text.setAttribute('x', String(node.x + 20));
    text.setAttribute('y', String(node.y + 24));
    text.setAttribute('fill', '#0f2544');
    text.setAttribute('font-family', 'Arial, sans-serif');
    text.setAttribute('font-size', '12');
    const label = svgElement('tspan');
    label.setAttribute('font-weight', 'bold');
    label.textContent = LABELS[version][node.kind];
    text.appendChild(label);
    const value = svgElement('tspan');
    value.setAttribute('x', String(node.x + 20));
    value.setAttribute('dy', '22');
    value.textContent = node.label.length > 30 ? node.label.slice(0, 29) + '…' : node.label;
    text.appendChild(value);
    svg.appendChild(text);
  });
  const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' });
  const source = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not available');
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((result) => {
        if (!result) { onError('Unable to create PNG.'); return; }
        const url = URL.createObjectURL(result);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'csdm-v2-diagram.png';
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 500);
      }, 'image/png');
    } catch (error) { onError(String(error)); }
    finally { URL.revokeObjectURL(source); }
  };
  img.onerror = () => { URL.revokeObjectURL(source); onError('PNG rendering failed.'); };
  img.src = source;
};
const Label = ({ children }: { children: string }) =>
  h('label', { className: 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500' }, children);
const Stat = ({ label, value, detail }: { label: string; value: string | number; detail?: string }) =>
  h('div', { className: box + ' p-5' }, [
    h('p', { className: 'text-sm font-medium text-slate-500', key: 'l' }, label),
    h('p', { className: 'mt-2 text-3xl font-semibold text-slate-900', key: 'v' }, String(value)),
    detail ? h('p', { className: 'mt-1 text-xs text-slate-500', key: 'd' }, detail) : null,
  ]);
const severityStyle: Record<string, string> = {
  High: 'border-red-200 bg-red-50 text-red-800',
  Medium: 'border-amber-200 bg-amber-50 text-amber-800',
  Low: 'border-blue-200 bg-blue-50 text-blue-800',
};
// Dedicated directional handles stop React Flow's default top/bottom anchor routing
// from making short CSDM relationships look like loops around each entity.
const CsdmNode = ({ data }: { data: { kind: EntityKind; fullLabel: string; heading: string } }) => h('div', {
  className: 'relative rounded-xl border border-slate-300 bg-white px-4 py-3 text-center shadow-sm',
  style: { width: 246, minHeight: 70, backgroundColor: data.kind === 'service_instance' ? '#e0f2fe' : '#ffffff' },
}, [
  h(Handle, { key: 'target-left', id: 'target-left', type: 'target', position: Position.Left,
    style: { opacity: 0, width: 8, height: 8 } }),
  h(Handle, { key: 'target-right', id: 'target-right', type: 'target', position: Position.Right,
    style: { opacity: 0, width: 8, height: 8 } }),
  h(Handle, { key: 'source-left', id: 'source-left', type: 'source', position: Position.Left,
    style: { opacity: 0, width: 8, height: 8 } }),
  h(Handle, { key: 'source-right', id: 'source-right', type: 'source', position: Position.Right,
    style: { opacity: 0, width: 8, height: 8 } }),
  h('div', { className: 'text-[10px] font-semibold uppercase tracking-wide text-slate-500', key: 'heading' }, data.heading),
  h('div', { className: 'mt-1 break-words text-xs font-semibold text-slate-900', key: 'name' }, data.fullLabel),
]);
const NODE_TYPES = { csdm: CsdmNode };
const App = () => {
  const [version, setVersion] = useState('5') as [CsdmVersion, (value: CsdmVersion) => void];
  const [records, setRecords] = useState([]) as [CsdmRecord[], (value: CsdmRecord[]) => void];
  const [file, setFile] = useState(null) as [File | null, (value: File | null) => void];
  const [fileKey, setFileKey] = useState(0);
  const [analysed, setAnalysed] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState('all') as [ModelView, (value: ModelView) => void];
  const [environment, setEnvironment] = useState('');
  const [criticality, setCriticality] = useState('');
  const [search, setSearch] = useState('');
  const [statuses, setStatuses] = useState({}) as [Record<string, Finding['status']>, (value: Record<string, Finding['status']>) => void];
  const [selectedNode, setSelectedNode] = useState(null) as [{ kind: EntityKind; id: string; label: string } | null,
    (value: { kind: EntityKind; id: string; label: string } | null) => void];
  const result = useMemo(() => analyse(records, version), [records, version]);
  const findings = useMemo(() => result.findings.map((f: Finding) => ({
    ...f, status: statuses[f.id] || f.status,
  })), [result, statuses]) as Finding[];
  const filtered = useMemo(() => records.filter((record: CsdmRecord) =>
    (!environment || record.environment === environment) &&
    (!criticality || record.criticality === criticality) &&
    (!search || FIELDS.some((field) => record[field].toLowerCase().includes(search.toLowerCase())))),
  [records, environment, criticality, search]) as CsdmRecord[];
  const graph = useMemo(() => createGraph(filtered, version, view), [filtered, version, view]);
  const flowNodes = useMemo(() => graph.nodes.map((n: Graph['nodes'][number]) => ({
    id: n.id, type: 'csdm',
    data: { heading: LABELS[version][n.kind], kind: n.kind, fullLabel: n.label },
    position: { x: n.x, y: n.y },
  })), [graph, version]);
  const flowEdges = useMemo(() => {
    const positions = new Map(graph.nodes.map((node: Graph['nodes'][number]) => [node.id, node.x]));
    return graph.edges.map((e: Graph['edges'][number]) => {
      const toRight = (positions.get(e.source) ?? 0) < (positions.get(e.target) ?? 0);
      return {
        id: e.id, source: e.source, target: e.target, label: e.label,
        sourceHandle: toRight ? 'source-right' : 'source-left',
        targetHandle: toRight ? 'target-left' : 'target-right',
        type: 'smoothstep', pathOptions: { borderRadius: 12, offset: 18 },
        labelStyle: { fontSize: 9, fill: '#334155', fontWeight: 600 },
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 }, labelBgPadding: [5, 3],
        style: { strokeWidth: 1.6, stroke: e.relationType === 'Reference' ? '#94a3b8' : '#2563eb',
          strokeDasharray: e.relationType === 'Reference' ? '5 4' : undefined },
        markerEnd: { type: MarkerType.ArrowClosed },
      };
    });
  }, [graph]);
  const envOptions = Array.from(new Set(records.map((r: CsdmRecord) => r.environment).filter(Boolean))).sort() as string[];
  const critOptions = Array.from(new Set(records.map((r: CsdmRecord) => r.criticality).filter(Boolean))).sort() as string[];
  const visibleRows = new Set(filtered.map((r) => records.indexOf(r) + 2));
  const visibleFindings = findings.filter((f) => visibleRows.has(f.row));
  const reset = () => {
    setFile(null); setFileKey(fileKey + 1); setRecords([]); setAnalysed(false);
    setStatuses({}); setEnvironment(''); setCriticality(''); setSearch(''); setSelectedNode(null); setError('');
  };
  const run = () => {
    if (!file) { setError('Select a CSV file first.'); return; }
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (parsed: { data: Record<string, unknown>[]; meta: { fields?: string[] }; errors?: { message: string }[] }) => {
        try {
          if (parsed.errors?.length) throw new Error('CSV parsing error: ' + parsed.errors[0].message);
          const next = parseRows(parsed.data, parsed.meta.fields || [], version);
          if (!next.length) throw new Error('The file contains no data rows.');
          setRecords(next); setAnalysed(true); setStatuses({}); setSelectedNode(null); setError('');
        } catch (e) { setError(e instanceof Error ? e.message : String(e)); setRecords([]); setAnalysed(false); }
      },
      error: (e: Error) => { setError(e.message); setAnalysed(false); },
    });
  };
  const onFileSelected = (event: Event) => {
    const chosen = (event.target as HTMLInputElement).files?.[0] || null;
    reset(); setFile(chosen);
  };
  const options = (values: string[]) => [
    h('option', { key: '', value: '' }, 'All'),
    ...values.map((v) => h('option', { key: v, value: v }, v)),
  ];
  const allViews: { value: ModelView; label: string }[] = [
    { value: 'all', label: 'End-to-end' }, { value: 'application', label: 'Application' },
    { value: 'delivery', label: 'Service Delivery' }, { value: 'consumption', label: 'Service Consumption' },
  ];
  const columns = FIELDS.filter((field) => !field.endsWith('_sys_id'));
  return h('main', { className: 'min-h-screen bg-slate-50 text-slate-900' }, [
    h('header', { className: 'border-b border-slate-800 bg-[#0f2544] text-white', key: 'hero' },
      h('div', { className: 'mx-auto max-w-7xl px-5 py-9 lg:px-8' }, [
        h('div', { className: 'flex flex-wrap items-center justify-between gap-3', key: 'eyebrow' }, [
          h('p', { className: 'text-xs font-bold uppercase tracking-[.2em] text-sky-200', key: 'v' }, 'CSDM Visualizer / v2.0 workbench'),
          h('span', { className: chip + ' border-sky-700 bg-sky-900 text-sky-100', key: 'b' }, 'Browser-only · no backend'),
        ]),
        h('h1', { className: 'mt-4 text-3xl font-semibold tracking-tight sm:text-5xl', key: 'title' }, 'Service architecture, made inspectable.'),
        h('p', { className: 'mt-3 max-w-3xl text-base leading-7 text-slate-200', key: 'intro' },
          'Validate CSDM 4 and CSDM 5 service relationships, trace ownership and produce an actionable remediation register from a structured CSV export.'),
        h('p', { className: 'mt-3 text-xs text-sky-200', key: 'disclaimer' },
          'Independent educational tool. Not affiliated with or endorsed by ServiceNow. No compliance certification is implied.'),
      ])),
    h('div', { className: 'mx-auto max-w-7xl space-y-7 px-5 py-8 lg:px-8', key: 'body' }, [
      h('section', { className: box + ' overflow-hidden', key: 'input' }, [
        h('div', { className: 'border-b border-slate-200 bg-white px-6 py-5', key: 'heading' }, [
          h('h2', { className: 'text-xl font-semibold text-slate-900', key: 't' }, '1. Configure and import'),
          h('p', { className: 'mt-1 text-sm text-slate-600', key: 'd' },
            'Choose the CSDM version, download its template or select an existing CSV. Analysis starts only when requested.'),
        ]),
        h('div', { className: 'grid gap-6 p-6 lg:grid-cols-[260px_1fr]', key: 'content' }, [
          h('div', { key: 'version' }, [
            h(Label, { key: 'label' }, 'CSDM model version'),
            h('select', { className: selectStyle, 'aria-label': 'CSDM version', value: version,
              onChange: (event: Event) => setVersion((event.target as HTMLSelectElement).value as CsdmVersion), key: 'select' },
              [h('option', { value: '4', key: '4' }, 'CSDM 4'),
                h('option', { value: '5', key: '5' }, 'CSDM 5')]),
            h('div', { className: 'mt-3 rounded-lg bg-slate-100 px-3 py-3 text-xs leading-5 text-slate-600', key: 'desc' },
              version === '5'
                ? 'Uses Service Instance, Technology Management Service and Technology Management Offering.'
                : 'Uses Application Service, Technical Service and Technical Service Offering.'),
          ]),
          h('div', { key: 'file' }, [
            h(Label, { key: 'l' }, 'CSV import'),
            h('div', { className: 'flex flex-wrap items-center gap-3', key: 'actions' }, [
              h('label', { className: primary + ' cursor-pointer', htmlFor: 'csv-file', key: 'upload' }, [
                'Choose CSV', h('input', { id: 'csv-file', type: 'file', accept: '.csv,text/csv',
                  className: 'sr-only', key: fileKey, onChange: onFileSelected }),
              ]),
              h('button', { className: button, onClick: () => exportText('csdm-v' + version + '-sample.csv',
                toCsv(standardSample(), version), 'text/csv'), key: 'sample' }, 'Download v' + version + ' template'),
              h('button', { className: primary, disabled: !file, onClick: run, key: 'run' }, 'Run analysis'),
              h('button', { className: button, disabled: !file && !analysed, onClick: reset, key: 'clear' }, 'Clear'),
            ]),
            h('p', { className: 'mt-3 text-sm text-slate-600', key: 'selected' }, file ? 'Selected: ' + file.name :
              'No file selected. You can also use the sample to explore the expected fields.'),
            h('details', { className: 'mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4', key: 'guide' }, [
              h('summary', { className: 'cursor-pointer text-sm font-semibold text-slate-800', key: 'title' },
                'CSV field reference and legacy header support'),
              h('div', { className: 'mt-3 flex flex-wrap gap-2', key: 'names' },
                expectedHeaders(version).map((name: string) => h('code', {
                  className: 'rounded bg-white px-2 py-1 text-xs text-slate-700', key: name }, name))),
              h('p', { className: 'mt-3 text-xs leading-5 text-slate-600', key: 'note' },
                'The first four entity fields are assessed for core completeness. Optional object sys_id columns preserve identity. Legacy v1 CSV labels and CSDM 4/5 alternatives are recognised where unambiguous.'),
            ]),
          ]),
        ]),
        h('div', { className: 'border-t border-amber-200 bg-amber-50 px-6 py-3 text-xs leading-5 text-amber-900', key: 'privacy' },
          'Local browser processing only. Use synthetic or suitably anonymised data. Do not upload client, production, confidential, regulated or personal data.'),
      ]),
      error ? h('div', { className: 'rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800', role: 'alert', key: 'error' }, error) : null,
      h('section', { key: 'summary' }, [
        h('div', { className: 'mb-3 flex items-end justify-between gap-3', key: 'heading' }, [
          h('h2', { className: 'text-xl font-semibold', key: 'h' }, '2. Validation overview'),
          h('span', { className: chip + ' border-slate-200 bg-white text-slate-600', key: 's' }, analysed ? 'Analysed · CSDM ' + version : 'Awaiting analysis'),
        ]),
        h('div', { className: 'grid gap-3 sm:grid-cols-2 lg:grid-cols-5', key: 'cards' }, [
          h(Stat, { label: 'Readiness indicator', value: analysed ? result.score + '%' : '—', detail: 'Advisory, not certification', key: 'score' }),
          h(Stat, { label: 'Rows', value: analysed ? result.total : '—', key: 'rows' }),
          h(Stat, { label: 'Core-complete rows', value: analysed ? result.valid : '—', key: 'valid' }),
          h(Stat, { label: 'High-priority findings', value: analysed ? result.counts.High : '—', key: 'high' }),
          h(Stat, { label: 'Exact duplicate rows', value: analysed ? result.duplicates : '—', key: 'duplicates' }),
        ]),
        h('p', { className: 'mt-3 text-xs leading-5 text-slate-500', key: 'math' },
          'Score = 100 − weighted findings ÷ (32 × rows) × 100, floored at zero. High = 8, Medium = 4, Low = 2. Repeated service references are not duplicates.'),
      ]),
      analysed ? h('section', { className: box + ' p-5', key: 'filters' }, [
        h('h2', { className: 'text-lg font-semibold', key: 't' }, '3. Explore and filter'),
        h('div', { className: 'mt-4 grid gap-3 md:grid-cols-4', key: 'controls' }, [
          h('div', { key: 'env' }, [h(Label, {}, 'Environment'),
            h('select', { className: selectStyle, value: environment, onChange: (e: Event) => setEnvironment((e.target as HTMLSelectElement).value) }, options(envOptions))]),
          h('div', { key: 'crit' }, [h(Label, {}, 'Criticality'),
            h('select', { className: selectStyle, value: criticality, onChange: (e: Event) => setCriticality((e.target as HTMLSelectElement).value) }, options(critOptions))]),
          h('div', { className: 'md:col-span-2', key: 'search' }, [h(Label, {}, 'Find applications, offerings or owners'),
            h('input', { className: selectStyle, type: 'search', placeholder: 'Search across available fields', value: search,
              onChange: (e: Event) => setSearch((e.target as HTMLInputElement).value) })]),
        ]),
        h('div', { className: 'mt-4 flex flex-wrap gap-2', key: 'views' },
          allViews.map((v) => h('button', { className: view === v.value ? primary : button, key: v.value,
            onClick: () => { setView(v.value); setSelectedNode(null); } }, v.label))),
        h('p', { className: 'mt-3 text-xs text-slate-500', key: 'n' },
          'Showing ' + filtered.length + ' of ' + records.length + ' rows. Filtering affects the diagram, findings table and record preview; overall score remains based on the full upload.'),
      ]) : null,
      analysed ? h('section', { className: box + ' overflow-hidden', key: 'graph' }, [
        h('div', { className: 'flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4', key: 'head' }, [
          h('div', { key: 'texts' }, [
            h('h2', { className: 'text-xl font-semibold', key: 'title' }, 'Relationship explorer'),
            h('p', { className: 'mt-1 text-xs text-slate-500', key: 'help' },
              'Blue lines are CMDB relationships; dashed grey lines are parent references. Click a node to inspect its identity.'),
          ]),
          h('button', { className: button, disabled: !graph.nodes.length, onClick: () => pngExport(graph, version, setError), key: 'png' }, 'Export PNG'),
        ]),
        graph.truncated ? h('p', { className: 'border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900', key: 'limit' },
          'Diagram limited to the first 120 unique nodes (' + graph.totalNodes + ' in the current filter). Narrow the filters to inspect other entities.') : null,
        h('div', { className: 'h-[540px] bg-slate-50', key: 'canvas' },
          h(FlowCanvas, { nodes: flowNodes, edges: flowEdges, nodeTypes: NODE_TYPES, fitView: true, minZoom: 0.12,
            onNodeClick: (_event: unknown, node: { id: string; data: { kind: EntityKind; fullLabel: string } }) =>
              setSelectedNode({ id: node.id, kind: node.data.kind, label: node.data.fullLabel }) }, [
              h(Background, { key: 'background' }), h(Controls, { key: 'controls' }), h(MiniMap, { key: 'map' }),
            ])),
        selectedNode ? h('div', { className: 'border-t border-slate-200 bg-sky-50 px-5 py-3 text-sm', key: 'detail' }, [
          h('strong', { key: 'title' }, LABELS[version][selectedNode.kind] + ': '),
          h('span', { key: 'name' }, selectedNode.label),
          h('span', { className: 'ml-3 break-all text-xs text-slate-500', key: 'id' }, selectedNode.id),
        ]) : null,
      ]) : null,
      analysed ? h('section', { className: box + ' overflow-hidden', key: 'issues' }, [
        h('div', { className: 'flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4', key: 'head' }, [
          h('div', { key: 'texts' }, [
            h('h2', { className: 'text-xl font-semibold', key: 'title' }, '4. Remediation register'),
            h('p', { className: 'mt-1 text-xs text-slate-500', key: 'sub' }, 'Issue-level evidence and suggested remediation. Status changes remain in memory until exported.'),
          ]),
          h('div', { className: 'flex flex-wrap gap-2', key: 'exports' }, [
            h('button', { className: button, onClick: () => exportText('csdm-v2-remediation.csv',
              remediationCsv(findings), 'text/csv'), key: 'csv' }, 'Export remediation CSV'),
            h('button', { className: button, onClick: () => exportText('csdm-v2-assessment.json',
              JSON.stringify({ version, summary: { ...result, findings: undefined }, findings, records }, null, 2),
              'application/json'), key: 'json' }, 'Export JSON'),
            h('button', { className: button, onClick: () => exportText('csdm-v2-report.md',
              reportMarkdown({ ...result, findings }, version), 'text/markdown'), key: 'md' }, 'Export Markdown'),
          ]),
        ]),
        visibleFindings.length === 0
          ? h('p', { className: 'px-5 py-6 text-sm text-slate-600', key: 'empty' }, 'No validation findings in the current filter.')
          : h('div', { className: 'max-h-[440px] overflow-auto', key: 'scroll' },
            h('table', { className: 'min-w-full divide-y divide-slate-200 text-left text-sm', key: 'table' }, [
              h('thead', { className: 'sticky top-0 bg-slate-100 text-xs uppercase text-slate-600', key: 'thead' },
                h('tr', {}, ['Row', 'Finding', 'Severity', 'Entity', 'Recommendation', 'Status'].map((name) =>
                  h('th', { className: 'whitespace-nowrap px-4 py-3', key: name }, name)))),
              h('tbody', { className: 'divide-y divide-slate-100', key: 'body' },
                visibleFindings.map((f) => h('tr', { key: f.id }, [
                  h('td', { className: 'px-4 py-3 text-slate-500', key: 'row' }, f.row),
                  h('td', { className: 'min-w-[180px] px-4 py-3 font-medium', key: 'code' }, format(f.code)),
                  h('td', { className: 'px-4 py-3', key: 'severity' },
                    h('span', { className: chip + ' ' + severityStyle[f.severity] }, f.severity)),
                  h('td', { className: 'max-w-[180px] break-words px-4 py-3', key: 'entity' }, f.entity),
                  h('td', { className: 'min-w-[280px] px-4 py-3 text-slate-600', key: 'action' }, f.recommendation),
                  h('td', { className: 'px-4 py-3', key: 'status' },
                    h('select', { className: selectStyle, 'aria-label': 'Status for ' + f.code + ' row ' + f.row,
                      value: f.status, onChange: (e: Event) => setStatuses({ ...statuses,
                        [f.id]: (e.target as HTMLSelectElement).value as Finding['status'] }) },
                    ['Open', 'In progress', 'Resolved'].map((s) => h('option', { key: s, value: s }, s)))),
                ]))),
            ])),
      ]) : null,
      analysed ? h('section', { className: box + ' overflow-hidden', key: 'table' }, [
        h('div', { className: 'border-b border-slate-200 px-5 py-4', key: 'heading' }, [
          h('h2', { className: 'text-xl font-semibold', key: 'title' }, '5. Parsed record preview'),
          h('p', { className: 'mt-1 text-xs text-slate-500', key: 'desc' }, 'Showing the first 100 matching rows. Exported JSON contains all analysed records.'),
        ]),
        h('div', { className: 'max-h-[400px] overflow-auto', key: 'scroll' }, h('table', {
          className: 'min-w-full divide-y divide-slate-200 text-left text-xs',
        }, [
          h('thead', { className: 'sticky top-0 bg-slate-100', key: 'thead' },
            h('tr', {}, columns.map((column) => h('th', { className: 'whitespace-nowrap px-3 py-3', key: column },
              column in LABELS[version] ? LABELS[version][column as EntityKind] : format(column))))),
          h('tbody', { className: 'divide-y divide-slate-100', key: 'tbody' },
            filtered.slice(0, 100).map((record: CsdmRecord, index: number) =>
              h('tr', { key: index, className: CORE_FIELDS.every((field) => normal(record[field])) ? '' : 'bg-amber-50' },
                columns.map((column) => h('td', { className: 'whitespace-nowrap px-3 py-3 text-slate-700', key: column },
                  record[column] || '—'))))),
        ])),
      ]) : null,
    ]),
    h('footer', { className: 'border-t border-slate-200 bg-white px-5 py-6 text-center text-xs text-slate-500', key: 'footer' }, [
      'CSDM Visualizer v2.0 · Built by Enamul Haque · Independent educational tool · ',
      h('a', { href: 'https://github.com/haquenam/csdm-service-model-visualizer',
        target: '_blank', rel: 'noopener noreferrer', className: 'text-blue-700 underline', key: 'github' }, 'GitHub'),
    ]),
  ]);
};
ReactDOM.createRoot(document.getElementById('root')).render(h(App));

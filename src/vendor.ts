// Bundled locally by esbuild. The existing UI uses the UMD-style globals,
// allowing the v2.0 React UI to migrate without a wholesale rewrite.
import React from 'react';
import { createRoot } from 'react-dom/client';
import ReactFlowDefault, * as ReactFlowLibrary from 'reactflow';
import Papa from 'papaparse';

Object.assign(globalThis, {
  React,
  ReactDOM: { createRoot },
  ReactFlow: { ...ReactFlowLibrary, ReactFlow: ReactFlowDefault },
  Papa,
});

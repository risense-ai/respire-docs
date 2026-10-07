#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const files = [
  'core-api.json',
  'cli-artifact-manifest.json',
  'client-compatibility-matrix.json',
];

for (const name of files) {
  const data = JSON.parse(readFileSync(join(root, name), 'utf8'));
  if (data.schemaVersion !== 1) {
    console.error(`${name}: schemaVersion must be 1`);
    process.exit(1);
  }
}

const core = JSON.parse(readFileSync(join(root, 'core-api.json'), 'utf8'));
const request = JSON.parse(readFileSync(join(root, 'core-abi/request.schema.json'), 'utf8'));
const response = JSON.parse(readFileSync(join(root, 'core-abi/response.schema.json'), 'utf8'));
if (core.distribution !== 'binary-sdk-staticlib-c-abi' || core.abiVersion !== 0x00010001
    || core.requestSchemaVersion !== request.properties.schema_version.const
    || core.requestSchemaVersion !== response.properties.schema_version.const) {
  throw new Error('Core distribution / ABI / JSON schema version mismatch');
}
if (JSON.stringify([...core.operations].sort()) !== JSON.stringify([...request.properties.operation.enum].sort())) {
  throw new Error('Core operation list differs from request schema');
}
for (const type of ['prepared', 'snapshot', 'memoryEntry', 'memoryQuery', 'preparePayload', 'queryPayload', 'rememberCandidatesPayload', 'relatedPayload']) {
  if (!request.$defs[type]) throw new Error(`Core request schema missing ${type}`);
}
if (!response.$defs.relatedResult) throw new Error('Core response schema missing relatedResult');
const header = readFileSync(join(root, 'core-abi/respire_core.h'), 'utf8');
for (const name of ['rs_core_abi_version', 'rs_core_create', 'rs_core_call', 'rs_core_call_with_transport', 'rs_core_buffer_free', 'rs_core_destroy']) {
  if (!header.includes(`${name}(`)) throw new Error(`Core header missing ${name}`);
}

const manifest = JSON.parse(readFileSync(join(root, 'cli-artifact-manifest.json'), 'utf8'));
if (manifest.binaryName !== 'rsrs' || !Array.isArray(manifest.commandAliases) || manifest.commandAliases.length !== 0) {
  throw new Error('The Respire CLI must be rsrs without command aliases');
}
const matrix = JSON.parse(readFileSync(join(root, 'client-compatibility-matrix.json'), 'utf8'));
const triples = new Set(manifest.targets.map((t) => t.triple));
for (const t of matrix.supportedTargets) {
  if (!triples.has(matrix.cliArtifactTargets?.[t] || t)) {
    console.error(`compatibility target missing from CLI manifest: ${t}`);
    process.exit(1);
  }
}
if (manifest.sidecar.fileName !== matrix.sidecar.fileName) {
  console.error('sidecar fileName mismatch between CLI manifest and client matrix');
  process.exit(1);
}

const yaml = readFileSync(join(root, 'openapi.yaml'), 'utf8');
for (const route of ['/health', '/register', '/login', '/push', '/pull', '/v2/push/batch', '/v2/pull']) {
  if (!yaml.includes(route)) {
    console.error(`openapi.yaml missing ${route}`);
    process.exit(1);
  }
}

console.log('contracts ok');

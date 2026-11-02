import bundle from './bundle.json';

const script = (source: string) => `<script>${source.replace(/<\/script/gi, '<\\/script')}</script>`;

// All code and model bytes are bundled. This document never contacts a server.
export const ENGINE_HTML = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'"></head><body>
${script(`window.resonaModelAssets=${JSON.stringify({ manifest: bundle.manifest, weights: bundle.weights })};`)}
${script(bundle.audio)}${script(bundle.model)}${script(bundle.bridge)}
</body></html>`;

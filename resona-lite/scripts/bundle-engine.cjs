const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '../src/engine');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const bundle = {
  audio: read('vendor/audio.js'),
  model: read('vendor/chord-model.js'),
  manifest: JSON.parse(read('vendor/chord-model/model.json')),
  weights: fs.readFileSync(path.join(root, 'vendor/chord-model/weights.bin')).toString('base64'),
  bridge: read('bridge.js'),
};
fs.writeFileSync(path.join(root, 'bundle.json'), JSON.stringify(bundle));

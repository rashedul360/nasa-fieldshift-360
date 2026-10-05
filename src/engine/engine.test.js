// Run with: npm test   (Node built-in test runner)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeClimate, backtest, timeMachine, SEASONS } from './climate.js';
import { RABI_CROPS } from './crops.js';
import { decide, weightsFor } from './decision.js';
import { recommendRotation } from './rotation.js';
import { waterAdvice, cropStage } from './water.js';
import { dbscan, findHotspots } from './cluster.js';
import { buildDemo } from '../data/demo.js';
import { makeUnion } from './world.js';

const climJson = JSON.parse(readFileSync(new URL('../data/climate_godagari.json', import.meta.url)));
const soilJson = JSON.parse(readFileSync(new URL('../data/soil_godagari.json', import.meta.url)));
const clim = makeClimate(climJson);

test('25 seasons, backtest covers them all', () => {
  assert.equal(SEASONS.length, 25);
  const bt = backtest(clim, RABI_CROPS.tomato, 0);
  assert.equal(bt.then.n + bt.now.n, 25);
});

test('weights always sum to 1', () => {
  for (const p of [[], ['water'], ['soil', 'early'], ['income', 'risk']]) {
    const s = Object.values(weightsFor(p)).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(s - 1) < 1e-9);
  }
});

test('decision returns a label and ranked options', () => {
  const demo = buildDemo();
  const plot = demo.farmers.find((f) => f.id === 'RAHIM');
  const union = makeUnion(clim, demo, plot.union);
  const d = decide({ clim, soil: soilJson.unions[plot.union], plot, union, priorities: ['water'] });
  assert.ok(['KEEP', 'ADJUST', 'SHIFT'].includes(d.label));
  assert.equal(d.options.length, 5);
  const rot = recommendRotation({ clim, soil: soilJson.unions[plot.union], plot, chosen: d.rec, priorities: ['water'] });
  assert.ok(rot.best || rot.directAman);
  console.log('label', d.label, 'rec', d.rec.crop.id, d.rec.shift, 'scores', d.options.map((o) => `${o.crop.id}:${o.score.toFixed(0)}`).join(' '));
  console.log('rotation', rot.best?.crop.id, rot.directAman);
});

test('priorities change the ranking weights', () => {
  const demo = buildDemo();
  const plot = demo.farmers.find((f) => f.id === 'RAHIM');
  const union = makeUnion(clim, demo, plot.union);
  const a = decide({ clim, soil: soilJson.unions[plot.union], plot, union, priorities: ['income'] });
  const b = decide({ clim, soil: soilJson.unions[plot.union], plot, union, priorities: ['water'] });
  console.log('income→', a.options[0].crop.id, ' water→', b.options[0].crop.id);
  assert.notDeepEqual(a.weights, b.weights);
});

test('water advice colours', () => {
  const c = RABI_CROPS.tomato;
  const st = cropStage(c, 50);
  assert.equal(waterAdvice({ crop: c, stage: st, rain7: 0, rainNext3: 0, tmax: 27, fieldCheck: 'wet' }).color, 'GREEN');
  assert.equal(waterAdvice({ crop: c, stage: st, rain7: 0, rainNext3: 0, tmax: 36, fieldCheck: 'dry' }).color, 'RED');
  assert.equal(waterAdvice({ crop: c, stage: st, rain7: 0, rainNext3: 0, tmax: 26, fieldCheck: null }).color, 'YELLOW');
});

test('DBSCAN finds the seeded Deopara leaf-spot cluster', () => {
  const demo = buildDemo();
  const hs = findHotspots(demo.requests);
  assert.ok(hs.length >= 1, 'expected at least one hotspot');
  assert.ok(hs[0].members.length >= 5);
  assert.equal(dbscan([{ id: 1, lat: 0, lon: 0 }], 1, 2).length, 0);
});

test('time machine produces then/now means', () => {
  const tm = timeMachine(clim);
  for (const m of Object.values(tm)) assert.ok(m.then !== null && m.now !== null);
});

import fs from 'fs';

const data = JSON.parse(fs.readFileSync('src/routeData.json', 'utf-8'));
const pts = data.points;

console.log('--- SAMPLE OF POINTS ALONG TRACK ---');
for (let i = 0; i < pts.length; i += 15) {
  const p = pts[i];
  const percent = (p.dist / data.totalDist * 100).toFixed(1);
  console.log(`idx: ${i}, dist: ${p.dist.toFixed(2)}km (${percent}%), lat: ${p.lat}, lon: ${p.lon}, ele: ${p.ele}`);
}

import fs from 'fs';

const xml = fs.readFileSync('public/gpx/Corrida_matinal.gpx', 'utf-8');

const trkptRegex = /<trkpt lat="([^"]+)" lon="([^"]+)">\s*<ele>([^<]+)<\/ele>/g;
let match;
const pts = [];

while ((match = trkptRegex.exec(xml)) !== null) {
  pts.push({
    lat: parseFloat(match[1]),
    lon: parseFloat(match[2]),
    ele: parseFloat(match[3])
  });
}

function haversine(p1, p2) {
  const R = 6371; // km
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLon = (p2.lon - p1.lon) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

let totalDist = 0;
let elevationGain = 0;
let minEle = 99999, maxEle = -99999;
let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;

const cumDists = [0];

for (let i = 0; i < pts.length; i++) {
  const p = pts[i];
  if (p.ele < minEle) minEle = p.ele;
  if (p.ele > maxEle) maxEle = p.ele;
  if (p.lat < minLat) minLat = p.lat;
  if (p.lat > maxLat) maxLat = p.lat;
  if (p.lon < minLon) minLon = p.lon;
  if (p.lon > maxLon) maxLon = p.lon;
  
  if (i > 0) {
    const d = haversine(pts[i-1], p);
    totalDist += d;
    cumDists.push(totalDist);
    const eleDiff = p.ele - pts[i-1].ele;
    if (eleDiff > 0) elevationGain += eleDiff;
  }
}

console.log('Total Points:', pts.length);
console.log('Total Dist (km):', totalDist.toFixed(2));
console.log('Elevation Min:', minEle, 'Max:', maxEle, 'Gain:', elevationGain.toFixed(1));
console.log('BBox Lat:', minLat, 'to', maxLat);
console.log('BBox Lon:', minLon, 'to', maxLon);

// Sample points for smooth SVG path rendering (e.g. 150 points)
const step = Math.max(1, Math.floor(pts.length / 200));
const sampled = [];
for (let i = 0; i < pts.length; i += step) {
  sampled.push({
    ...pts[i],
    dist: cumDists[i]
  });
}
if (sampled[sampled.length - 1] !== pts[pts.length - 1]) {
  sampled.push({
    ...pts[pts.length - 1],
    dist: totalDist
  });
}

fs.writeFileSync('src/routeData.json', JSON.stringify({
  totalDist: Number(totalDist.toFixed(2)),
  elevationGain: Math.round(elevationGain),
  minEle,
  maxEle,
  minLat,
  maxLat,
  minLon,
  maxLon,
  points: sampled
}, null, 2));

console.log('Wrote routeData.json with', sampled.length, 'sampled points');

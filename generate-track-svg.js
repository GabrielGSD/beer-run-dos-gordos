import fs from 'fs';

const xml = fs.readFileSync('public/gpx/Corrida_matinal.gpx', 'utf-8');

const trkptRegex = /<trkpt lat="([^"]+)" lon="([^"]+)">\s*<ele>([^<]+)<\/ele>/g;
let match;
const rawPts = [];

while ((match = trkptRegex.exec(xml)) !== null) {
  rawPts.push({
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

// Compute cumulative distances
let totalDist = 0;
let elevationGain = 0;
let minEle = 99999, maxEle = -99999;
let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;

const pts = rawPts.map((p, i) => {
  if (p.ele < minEle) minEle = p.ele;
  if (p.ele > maxEle) maxEle = p.ele;
  if (p.lat < minLat) minLat = p.lat;
  if (p.lat > maxLat) maxLat = p.lat;
  if (p.lon < minLon) minLon = p.lon;
  if (p.lon > maxLon) maxLon = p.lon;

  if (i > 0) {
    const d = haversine(rawPts[i-1], p);
    totalDist += d;
    const diff = p.ele - rawPts[i-1].ele;
    if (diff > 0) elevationGain += diff;
  }
  return {
    ...p,
    dist: totalDist
  };
});

// We want to map (lon, lat) to (X, Y) in an SVG viewBox.
// In geography:
// Latitude is North/South. Higher lat = North (smaller Y in SVG). Lower lat = South (larger Y in SVG).
// Longitude is West/East. Lower lon = West (smaller X in SVG). Higher lon = East (larger X in SVG).
// Mercator or equirectangular projection adjusted for local latitude (lat ~ -22.13)
const latMid = (minLat + maxLat) / 2;
const cosLat = Math.cos(latMid * Math.PI / 180);

const lonWidth = (maxLon - minLon) * cosLat;
const latHeight = maxLat - minLat;

console.log('Aspect ratio (W / H):', lonWidth / latHeight);

// Let SVG coordinate system be width = 800, height = 1000 (or portrait proportions like the image)
// Let's add padding around the track: e.g. 80px left/right, 80px top/bottom
const SVG_W = 800;
const SVG_H = 1000;
const PAD_X = 100;
const PAD_Y = 100;

const usableW = SVG_W - PAD_X * 2;
const usableH = SVG_H - PAD_Y * 2;

// Calculate scale to fit nicely
const scaleX = usableW / ((maxLon - minLon) * cosLat);
const scaleY = usableH / (maxLat - minLat);
const scale = Math.min(scaleX, scaleY);

const offsetX = PAD_X + (usableW - (maxLon - minLon) * cosLat * scale) / 2;
const offsetY = PAD_Y + (usableH - (maxLat - minLat) * scale) / 2;

function project(lat, lon) {
  const x = offsetX + (lon - minLon) * cosLat * scale;
  // Lat inverted: maxLat is at top (offsetY), minLat is at bottom
  const y = offsetY + (maxLat - lat) * scale;
  return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
}

// Sample points for path (reduce to e.g. 400 smooth points)
const sampledStep = Math.max(1, Math.floor(pts.length / 350));
const pathPoints = [];
for (let i = 0; i < pts.length; i += sampledStep) {
  const p = pts[i];
  const xy = project(p.lat, p.lon);
  pathPoints.push({
    x: xy.x,
    y: xy.y,
    lat: p.lat,
    lon: p.lon,
    ele: p.ele,
    dist: p.dist
  });
}
// ensure last point
const lastPt = pts[pts.length - 1];
const lastXY = project(lastPt.lat, lastPt.lon);
pathPoints.push({
  x: lastXY.x,
  y: lastXY.y,
  lat: lastPt.lat,
  lon: lastPt.lon,
  ele: lastPt.ele,
  dist: lastPt.dist
});

// Generate SVG Path d string
let pathD = `M ${pathPoints[0].x} ${pathPoints[0].y}`;
for (let i = 1; i < pathPoints.length; i++) {
  pathD += ` L ${pathPoints[i].x} ${pathPoints[i].y}`;
}

// Find key waypoints coordinates & projected (x,y):
const waypoints = [
  {
    id: 'start-finish',
    name: 'Sítio dos Gordos',
    subtitle: 'Largada & Chegada',
    type: 'start_finish',
    km: 0.0,
    kmEnd: 6.37,
    ele: 952,
    desc: 'Ponto de concentração, largada oficial, chegada com chopp e churrasco de celebração!',
    icon: 'flag-beer',
    targetLat: -22.14189,
    targetLon: -45.60297
  },
  {
    id: 'cachoeira',
    name: 'Cachoeira do Raimundo',
    subtitle: 'Beleza Natural & Banho',
    type: 'nature',
    km: 0.65,
    ele: 954,
    desc: 'Passagem ao lado da famosa cachoeira com queda d\'água cristalina da serra.',
    icon: 'waterfall',
    targetLat: -22.142575,
    targetLon: -45.59794
  },
  {
    id: 'encruzilhada',
    name: 'Encruzilhada da Macumba',
    subtitle: 'Ponto Místico do Trajeto',
    type: 'cultural',
    km: 1.15,
    ele: 906,
    desc: 'Tradicional bifurcação de terra na curva sudeste, guardada pela lenda do Zé Pilintra.',
    icon: 'ze-pilintra',
    targetLat: -22.141158,
    targetLon: -45.593281
  },
  {
    id: 'bairro-buraco',
    name: 'Bairro do Buraco',
    subtitle: 'Trecho de Subida Rústica',
    type: 'area',
    km: 1.70,
    ele: 869,
    desc: 'Estradinha cercada por morros verdes e mata nativa.',
    icon: 'hill',
    targetLat: -22.138687,
    targetLon: -45.595369
  },
  {
    id: 'apoio-tio',
    name: 'Ponto de Apoio - Casa do Tio',
    subtitle: 'Ponto de Chopp & Hidratação 1',
    type: 'beer',
    km: 2.20,
    ele: 871,
    desc: 'Primeira parada para hidratação gelada! Chopp artesanal na temperatura ideal para dar aquele gás.',
    icon: 'beer',
    targetLat: -22.134711,
    targetLon: -45.594115
  },
  {
    id: 'bairro-atirado',
    name: 'Bairro do Atirado',
    subtitle: 'Região Alta da Comunidade',
    type: 'area',
    km: 3.10,
    ele: 881,
    desc: 'Comunidade acolhedora com vista panorâmica de todo o vale.',
    icon: 'village',
    targetLat: -22.128148,
    targetLon: -45.595953
  },
  {
    id: 'igreja',
    name: 'Igrejinha do Atirado',
    subtitle: 'Patrimônio Histórico',
    type: 'cultural',
    km: 3.35,
    ele: 865,
    desc: 'Capela histórica no topo do bairro, marco visual da corrida.',
    icon: 'church',
    targetLat: -22.126500,
    targetLon: -45.596200
  },
  {
    id: 'quadra-futsal',
    name: 'Quadra de Futsal do Atirado',
    subtitle: 'Ponto Extremo Norte (Retorno)',
    type: 'landmark',
    km: 3.60,
    ele: 851,
    desc: 'Ponto de virada e contorno norte do circuito antes de iniciar o retorno.',
    icon: 'court',
    targetLat: -22.124869,
    targetLon: -45.599015
  },
  {
    id: 'apoio-morro-carater',
    name: 'Ponto de Apoio - Morro do Caráter',
    subtitle: 'Ponto de Chopp & Hidratação 2',
    type: 'beer',
    km: 4.80,
    ele: 928,
    desc: 'O famoso teste de caráter! Ponto de chopp no alto da serra para comemorar antes da descida final.',
    icon: 'beer',
    targetLat: -22.1336,
    targetLon: -45.6026
  }
];

// Calculate nearest projected points for each waypoint
const finalWaypoints = waypoints.map(wp => {
  // Find point in path closest to targetLat, targetLon
  let closest = pathPoints[0];
  let minDist = 999999;
  for (const pt of pathPoints) {
    const d = Math.hypot(pt.lat - wp.targetLat, pt.lon - wp.targetLon);
    if (d < minDist) {
      minDist = d;
      closest = pt;
    }
  }
  return {
    ...wp,
    x: closest.x,
    y: closest.y,
    actualKm: Number(closest.dist.toFixed(2)),
    actualEle: Math.round(closest.ele)
  };
});

// Also generate direction arrows along the track (every ~300m)
const arrows = [];
let nextArrowDist = 0.4; // first arrow at 400m
for (let i = 1; i < pathPoints.length; i++) {
  const pPrev = pathPoints[i-1];
  const pCurr = pathPoints[i];
  if (pCurr.dist >= nextArrowDist) {
    const angle = Math.atan2(pCurr.y - pPrev.y, pCurr.x - pPrev.x) * 180 / Math.PI;
    arrows.push({
      x: pCurr.x,
      y: pCurr.y,
      angle: Number(angle.toFixed(1)),
      dist: Number(pCurr.dist.toFixed(2))
    });
    nextArrowDist += 0.55; // arrow every 550m
  }
}

// Elevation profile for SVG chart (50 samples)
const profileStep = Math.max(1, Math.floor(pts.length / 60));
const profile = [];
for (let i = 0; i < pts.length; i += profileStep) {
  profile.push({
    dist: Number(pts[i].dist.toFixed(2)),
    ele: Math.round(pts[i].ele)
  });
}
profile.push({
  dist: Number(pts[pts.length - 1].dist.toFixed(2)),
  ele: Math.round(pts[pts.length - 1].ele)
});

const output = {
  svgViewBox: `0 0 ${SVG_W} ${SVG_H}`,
  svgWidth: SVG_W,
  svgHeight: SVG_H,
  totalDist: Number(totalDist.toFixed(2)),
  elevationGain: Math.round(elevationGain),
  minEle: Math.round(minEle),
  maxEle: Math.round(maxEle),
  pathD,
  pathPoints,
  waypoints: finalWaypoints,
  arrows,
  profile
};

fs.writeFileSync('src/trackGeoData.json', JSON.stringify(output, null, 2));
console.log('Successfully generated src/trackGeoData.json!');

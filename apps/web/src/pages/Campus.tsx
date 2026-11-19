import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BookOpen, CalendarDays, Church, DoorOpen, Landmark, ChevronLeft, ChevronRight, Coffee, Eye, Footprints, GraduationCap, Home as HomeIcon, MapPin, Mountain, Music2, TreePine, X } from 'lucide-react';
import { useApi } from '../lib/useApi';
import { when } from '../lib/format';

// Campus 3D de ULASALLE Arequipa (Av. Alfonso Ugarte 517). Es una maqueta simple hecha
// a partir de fotos del campus: no es un plano exacto. Cada lugar conecta con Parche.
type Place = {
  id: string; name: string; icon: typeof MapPin; pos: [number, number, number]; cam: [number, number, number];
  text: string; photo?: string; keywords: string[]; actions: { label: string; to: string }[];
};

const PLACES: Place[] = [
  { id: 'frontis', name: 'Frontis e ingreso', icon: DoorOpen, pos: [-52, 15, 30], cam: [-30, 18, 78],
    text: 'La entrada principal de ULASALLE: el muro rojo con el logo, las columnas azules y el "¡Bienvenidos!". Aquí empieza tu recorrido por el campus.',
    photo: '/img/campus-frontis.jpg', keywords: ['frontis', 'ingreso', 'entrada', 'recepcion', 'recepción'],
    actions: [{ label: 'Ver comunidades', to: '/comunidades' }, { label: 'Pedir ayuda', to: '/mentoria/nueva' }] },
  { id: 'puerta', name: 'Puerta 517', icon: MapPin, pos: [45, 10, 60], cam: [62, 14, 102],
    text: 'El ingreso por la Av. Alfonso Ugarte 517, con el mural de los volcanes hecho en piedra y la playa de estacionamiento.',
    photo: '/img/campus-puerta.jpg', keywords: ['puerta', 'porteria', 'portería', 'alfonso ugarte', 'estacionamiento'],
    actions: [{ label: 'Ver el mapa de la red', to: '/mapa' }] },
  { id: 'jardin', name: 'Jardín central', icon: TreePine, pos: [-24, 3, -20], cam: [-30, 16, 2],
    text: 'La gran área verde del campus, con las letras gigantes de La Salle. Aquí se arman tertulias, picnics de bienvenida y actividades de comunidades.',
    photo: '/img/campus-letras.jpg', keywords: ['jardin', 'jardín', 'area verde', 'patio', 'letras'],
    actions: [{ label: 'Ver comunidades', to: '/comunidades' }, { label: 'Crear una comunidad', to: '/comunidades/nueva' }] },
  { id: 'glorieta', name: 'Glorieta', icon: BookOpen, pos: [-20, 7, -40], cam: [-40, 14, -16],
    text: 'La glorieta de madera en medio del jardín: sombra, mesas y aire libre para estudiar en grupo o repasar antes de un examen.',
    keywords: ['glorieta', 'kiosko'],
    actions: [{ label: 'Ofrecer ayuda', to: '/mentoria' }] },
  { id: 'pabellon', name: 'Pabellón de aulas', icon: GraduationCap, pos: [8, 21, -26], cam: [-40, 28, -6],
    text: 'El pabellón de cinco pisos, con vigas azules y balcones de vidrio frente al jardín. Si te trabas en un curso, pide ayuda y le llega a quien domina el tema.',
    photo: '/img/campus-pabellon.jpg', keywords: ['aula', 'pabellon', 'pabellón', 'laboratorio', 'lab'],
    actions: [{ label: 'Pedir ayuda en un curso', to: '/mentoria/nueva' }, { label: 'Ver mentorías', to: '/mentoria' }] },
  { id: 'pasillo', name: 'Pasillos con vista', icon: Footprints, pos: [1, 12, -14], cam: [-16, 13, 2],
    text: 'Los corredores del pabellón dan al jardín y a la ciudad. Buen punto para encontrarte con tu grupo antes de clase.',
    photo: '/img/campus-pasillo.jpg', keywords: ['pasillo', 'corredor'],
    actions: [{ label: 'Buscar un grupo de estudio', to: '/comunidades' }] },
  { id: 'cafeteria', name: 'Terraza cafetería', icon: Coffee, pos: [8, 24, -42], cam: [-18, 36, -24],
    text: 'En el último piso: mesas bajo techo con vista al Misti y al Chachani. El lugar clásico para un café entre clases o para cerrar un trabajo en grupo.',
    photo: '/img/campus-cafeteria.jpg', keywords: ['cafeteria', 'cafetería', 'terraza', 'comedor'],
    actions: [{ label: 'Armar un grupo de estudio', to: '/comunidades/nueva' }] },
  { id: 'eventos', name: 'Terraza de eventos', icon: Music2, pos: [-22, 11, 4], cam: [-34, 24, 32],
    text: 'Sobre el edificio de dos pisos: una explanada abierta para danzas, ferias y actividades culturales, con la ciudad de fondo.',
    keywords: ['explanada', 'eventos', 'feria', 'danza', 'auditorio'],
    actions: [{ label: 'Ver retos y eventos', to: '/retos' }] },
  { id: 'claustro', name: 'Patio de las estatuas', icon: Landmark, pos: [39, 9, -41], cam: [62, 30, -8],
    text: 'Un patio interior con pileta y estatuas, rodeado de aulas de dos pisos. Tranquilo para leer o conversar.',
    keywords: ['claustro', 'estatuas', 'pileta', 'patio interior'],
    actions: [{ label: 'Ofrecer ayuda', to: '/mentoria' }] },
  { id: 'capilla', name: 'Capilla y jardines', icon: Church, pos: [40, 11, -2], cam: [52, 16, 32],
    text: 'La capilla con su torre de la cruz, rodeada de jardines, faroles y caminos. El corazón lasallista del campus.',
    keywords: ['capilla', 'misa', 'pastoral', 'jardines'],
    actions: [{ label: 'Ver comunidades', to: '/comunidades' }] },
  { id: 'misti', name: 'Mirador al Misti', icon: Mountain, pos: [-20, 70, -330], cam: [10, 22, 40],
    text: 'Desde los pisos altos se ven el Misti, el Chachani y el Pichu Pichu. Arequipa es la sede peruana de la red La Salle en Parche.',
    keywords: ['mirador'],
    actions: [{ label: 'La Salle hoy: Arequipa', to: '/noticias' }] },
];

const HOME_CAM: [number, number, number] = [55, 70, 110];
const HOME_TARGET: [number, number, number] = [-4, 0, -8];

function cssColor(name: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(v || 'white');
}

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || 'white';
}

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

function canvasTex(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  draw(ctx);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

function buildCampus(scene: THREE.Scene) {
  const C = {
    sky: cssColor('--campus-sky'), grass: cssColor('--campus-grass'), tree: cssColor('--campus-tree'), wall: cssColor('--campus-wall'),
    paving: cssColor('--campus-paving'), wood: cssColor('--campus-wood'), glass: cssColor('--campus-glass'), mountain: cssColor('--campus-mountain'),
    snow: cssColor('--campus-snow'), red: cssColor('--campus-red'), orange: cssColor('--campus-orange'), stone: cssColor('--campus-stone'),
    asphalt: cssColor('--campus-asphalt'), water: cssColor('--campus-water'), navy: cssColor('--navy'), navy2: cssColor('--navy2'),
    gold: cssColor('--gold'), sun: cssColor('--sun'), night: cssColor('--night'),
  };
  scene.background = C.sky;
  scene.fog = new THREE.Fog(C.sky, 200, 560);

  const cache = new Map<string, THREE.MeshStandardMaterial>();
  const mat = (color: THREE.Color, extra: THREE.MeshStandardMaterialParameters = {}) => {
    const k = color.getHexString() + JSON.stringify(extra);
    if (!cache.has(k)) cache.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra }));
    return cache.get(k)!;
  };
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, shadow = true) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = shadow; mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  };
  const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, shadow = true) => add(new THREE.BoxGeometry(w, h, d), m, x, y, z, shadow);

  const wall = mat(C.wall), navy2 = mat(C.navy2), wood = mat(C.wood), paving = mat(C.paving), grass = mat(C.grass), leaf = mat(C.tree, { flatShading: true });
  const night = mat(C.night, { roughness: 0.3, metalness: 0.2 });
  const glass = new THREE.MeshStandardMaterial({ color: C.glass, transparent: true, opacity: 0.45, roughness: 0.1, metalness: 0.1 });
  const white = cssVar('--white'), font = (px: number, w = 800) => `${w} ${px}px Nunito, system-ui, sans-serif`;

  // Terreno: ciudad alrededor, campus, río Chili al norte y Av. Alfonso Ugarte al sur
  add(new THREE.CircleGeometry(700, 48).rotateX(-Math.PI / 2), mat(C.mountain, { fog: false }), 0, -1.2, -150, false);
  add(new THREE.CircleGeometry(260, 48).rotateX(-Math.PI / 2), paving, 0, -1.1, 0, false);
  box(150, 1, 140, paving, 0, -0.5, -6, false);
  box(320, 0.3, 16, mat(C.water, { roughness: 0.2, metalness: 0.1 }), 0, -0.8, -86, false);
  box(260, 0.2, 12, mat(C.asphalt), 0, -0.05, 72, false);

  // Vecinos: galpones al oeste
  for (const [x, z, w, d] of [[-100, -35, 40, 60], [-100, 35, 40, 50]]) { box(w, 9, d, paving, x, 4.5, z); box(w + 1, 0.6, d + 1, mat(C.wall), x, 9.2, z); }

  function tree(x: number, z: number, s = 1) {
    box(0.5 * s, 2.6 * s, 0.5 * s, wood, x, 1.3 * s, z);
    add(new THREE.IcosahedronGeometry(2.6 * s, 0), leaf, x, 4.2 * s, z);
  }
  function cypress(x: number, z: number, h = 8) { add(new THREE.ConeGeometry(1.3, h, 8), leaf, x, h / 2, z); }

  // Pabellón: bloque con franjas azules, vigas azules en voladizo y balcones de vidrio
  function pabellon(x: number, z: number, length: number, floors: number, rotY: number, depth = 12) {
    const g = new THREE.Group();
    const h = 3.6;
    const body = new THREE.Mesh(new THREE.BoxGeometry(length, floors * h, depth), wall);
    body.position.y = (floors * h) / 2; body.castShadow = body.receiveShadow = true; g.add(body);
    const cols = Math.floor(length / 3.4);
    const wins = new THREE.InstancedMesh(new THREE.BoxGeometry(2.2, 1.6, 0.2), night, cols * floors);
    const beams = new THREE.InstancedMesh(new THREE.BoxGeometry(0.6, 0.6, 3.4), navy2, Math.floor(length / 6) * floors);
    const m4 = new THREE.Matrix4();
    let k = 0, b = 0;
    for (let f = 0; f < floors; f++) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(length + 0.4, 0.4, depth + 3), wall);
      slab.position.set(0, f * h + 0.2, 1.5); slab.castShadow = slab.receiveShadow = true; g.add(slab);
      const band = new THREE.Mesh(new THREE.BoxGeometry(length + 0.5, 0.18, 0.1), navy2);
      band.position.set(0, f * h + 0.3, depth / 2 + 3.02); g.add(band);
      if (f > 0) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 1.1, 0.12), glass);
        rail.position.set(0, f * h + 0.95, depth / 2 + 2.9); g.add(rail);
      }
      for (let c = 0; c < cols; c++) { m4.makeTranslation(-length / 2 + 1.7 + c * 3.4, f * h + 2, depth / 2 + 0.05); wins.setMatrixAt(k++, m4); }
      for (let c = 0; c < Math.floor(length / 6); c++) { m4.makeTranslation(-length / 2 + 3 + c * 6, f * h + 3.3, depth / 2 + 1.5); beams.setMatrixAt(b++, m4); }
    }
    const roof = new THREE.Mesh(new THREE.BoxGeometry(length + 0.6, 0.5, depth + 3.4), wall);
    roof.position.set(0, floors * h + 0.25, 1.4); roof.castShadow = true; g.add(roof);
    const roofRail = new THREE.Mesh(new THREE.BoxGeometry(length, 1.1, 0.12), glass);
    roofRail.position.set(0, floors * h + 1.05, depth / 2 + 3); g.add(roofRail);
    wins.castShadow = beams.castShadow = true;
    g.add(wins, beams);
    g.position.set(x, 0, z); g.rotation.y = rotY;
    scene.add(g);
  }

  // Pabellón principal de 5 pisos (norte-sur), con fachada hacia el jardín (oeste)
  pabellon(8, -28, 56, 5, -Math.PI / 2);
  const roofY = 5 * 3.6 + 0.5;
  box(6, roofY + 4, 6, wall, 9, (roofY + 4) / 2, 3);
  box(6.2, 0.5, 6.2, mat(C.paving), 9, roofY + 4.2, 3);
  // Terraza cafetería en el último piso
  box(12, 0.4, 20, wall, 8, roofY + 4, -42);
  for (const [cx, cz] of [[3, -33], [3, -42], [3, -51], [13, -33], [13, -51]]) add(new THREE.CylinderGeometry(0.22, 0.22, 4, 10), mat(C.paving, { metalness: 0.5, roughness: 0.4 }), cx, roofY + 2, cz);
  for (let i = 0; i < 6; i++) box(1.2, 0.9, 2.4, wood, 5 + (i % 2) * 5, roofY + 0.45, -48 + Math.floor(i / 2) * 6);

  // Jardín central con caminos, árboles y el toldo azul al norte
  box(42, 0.3, 46, grass, -22, 0.15, -29, false);
  box(42, 0.32, 2.4, paving, -22, 0.17, -6.5, false);
  for (let z = -50; z <= -8; z += 6) tree(-45, z, 1.1);
  for (let z = -48; z <= -12; z += 7) tree(-1.5, z, 0.9);
  for (const x of [-38, -26, -14, -2]) for (const z of [-60, -53]) box(0.3, 6, 0.3, mat(C.paving, { metalness: 0.4 }), x, 3, z);
  const shade = new THREE.MeshStandardMaterial({ color: C.navy2, side: THREE.DoubleSide, transparent: true, opacity: 0.88, roughness: 0.9 });
  for (const [x, rz] of [[-32, 0.08], [-20, -0.08], [-8, 0.08]]) { const t = box(12, 0.15, 9, shade, x, 6.2, -56.5); t.rotation.z = rz; }
  add(new THREE.CylinderGeometry(1.3, 1.6, 18, 10), leaf, -47, 9, -60);

  // Glorieta de madera
  const gx = -20, gz = -40;
  add(new THREE.CylinderGeometry(4.6, 4.6, 0.6, 8), wood, gx, 0.6, gz);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; add(new THREE.CylinderGeometry(0.22, 0.22, 3.6, 8), wood, gx + Math.cos(a) * 4.1, 2.7, gz + Math.sin(a) * 4.1); }
  add(new THREE.ConeGeometry(5.8, 2.6, 8), wood, gx, 5.8, gz);
  add(new THREE.ConeGeometry(1.2, 1.4, 8), wood, gx, 7.6, gz);
  for (let i = 0; i < 7; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; const r = box(3.1, 0.7, 0.15, mat(C.red), gx + Math.cos(a) * 4.2, 1.3, gz + Math.sin(a) * 4.2); r.rotation.y = -a + Math.PI / 2; }

  // Letras gigantes de La Salle en el jardín
  const letters = canvasTex(1024, 256, (ctx) => { ctx.fillStyle = white; ctx.font = font(220); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('La Salle', 512, 140); });
  const lm = new THREE.MeshStandardMaterial({ map: letters, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.5 });
  for (let k = 0; k < 4; k++) add(new THREE.PlaneGeometry(20, 5), lm, -24, 2.7, -20 - k * 0.12, false).castShadow = true;

  // Edificio de dos pisos al sur del jardín, con escalera exterior y terraza de eventos
  pabellon(-21, 3, 50, 2, Math.PI, 10);
  const stair = box(3, 0.5, 10, wall, 6.5, 3.6, -1); stair.rotation.x = -0.62;
  box(14, 1.1, 0.12, glass, -22, 8.5, -1.6, false);
  add(new THREE.CylinderGeometry(3, 3, 0.2, 24), mat(C.gold), -22, 7.8, 4);

  // Claustro: patio interior con pileta y estatuas
  for (const [x, z, w, d] of [[39, -58, 36, 8], [39, -24, 36, 8], [23, -41, 8, 26], [55, -41, 8, 26]]) {
    box(w, 7.2, d, wall, x, 3.6, z);
    box(w + 0.4, 0.3, d + 0.4, navy2, x, 3.7, z);
    box(w + 0.6, 0.4, d + 0.6, wall, x, 7.4, z);
  }
  box(24, 0.3, 26, grass, 39, 0.15, -41, false);
  add(new THREE.CylinderGeometry(2, 2.2, 0.8, 20), mat(C.stone), 39, 0.5, -41);
  add(new THREE.CylinderGeometry(1.6, 1.6, 0.2, 20), mat(C.water), 39, 0.95, -41, false);
  for (const [sx, sz] of [[31, -48], [47, -48], [31, -34], [47, -34], [35, -44], [43, -38]]) add(new THREE.CapsuleGeometry(0.45, 1.4, 4, 8), mat(C.snow), sx, 1.2, sz);

  // Capilla con torre de la cruz y jardines con faroles
  box(42, 0.3, 40, grass, 41, 0.15, 2, false);
  box(2.4, 0.32, 40, paving, 30, 0.17, 2, false);
  box(30, 0.32, 2.4, paving, 46, 0.17, 12, false);
  box(14, 5, 9, wall, 40, 2.5, -4);
  const roofC = add(new THREE.ConeGeometry(9.6, 2.4, 4), mat(C.paving), 40, 6.2, -4); roofC.rotation.y = Math.PI / 4; roofC.scale.set(1, 1, 0.68);
  box(9, 0.8, 0.4, mat(C.orange), 40, 4.4, 0.6);
  box(3, 3.8, 0.3, wood, 40, 1.9, 0.6);
  box(2.6, 11, 1.4, mat(C.stone), 49, 5.5, -2);
  box(0.5, 3, 0.2, mat(C.snow), 49, 8.6, -1.2, false);
  box(1.8, 0.5, 0.2, mat(C.snow), 49, 9.2, -1.2, false);
  for (const [lx, lz] of [[28, -10], [28, 2], [28, 14], [36, 12], [48, 12], [58, 12]]) {
    add(new THREE.CylinderGeometry(0.12, 0.12, 4, 6), navy2, lx, 2, lz);
    add(new THREE.SphereGeometry(0.45, 10, 8), mat(C.snow, { emissive: C.snow, emissiveIntensity: 0.2 }), lx, 4.2, lz, false);
  }
  for (const [tx, tz, sc] of [[56, -6, 1.2], [58, 6, 1], [24, 16, 1], [52, 18, 1.1], [34, 20, 0.9]]) tree(tx, tz, sc);
  for (let i = 0; i < 6; i++) cypress(22 + i * 3, -14, 5 + (i % 2) * 2);

  // Pabellón de vidrio con marcos azules
  box(10, 4, 5, glass, 20, 2.3, 16, false);
  for (const px of [15, 20, 25]) box(0.8, 4.6, 0.8, navy2, px, 2.3, 18.6);
  box(11, 0.6, 1, wall, 20, 4.7, 18.6);

  // Frontis de ULASALLE: muro rojo con el logo, columnas azules, Bienvenidos y escaleras
  const fx = -58, fz = 26;
  box(12, 14, 8, mat(C.red), fx, 7, fz);
  const logo = canvasTex(512, 512, (ctx) => {
    ctx.fillStyle = white; ctx.textBaseline = 'alphabetic';
    ctx.font = font(150); ctx.fillText('La', 40, 190); star(ctx, 330, 135, 72);
    ctx.fillText('Salle', 40, 340);
    ctx.font = font(64, 700); ctx.fillText('Universidad', 44, 430);
  });
  add(new THREE.PlaneGeometry(9, 9), new THREE.MeshStandardMaterial({ map: logo, transparent: true, roughness: 0.6 }), fx, 8.5, fz + 4.02, false);
  box(24, 12, 7, wall, fx + 18, 6, fz - 0.5);
  box(22, 10, 0.3, glass, fx + 18, 5.5, fz + 3.1, false);
  for (let i = 0; i < 5; i++) box(1.4, 13, 1.4, navy2, fx + 8 + i * 5, 6.5, fz + 3.8);
  box(12, 0.8, 4, wall, fx + 14, 8.4, fz + 5.5);
  const hello = canvasTex(512, 96, (ctx) => {
    ctx.fillStyle = cssVar('--navy2'); ctx.fillRect(0, 0, 512, 96);
    ctx.fillStyle = white; ctx.font = font(58); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('¡Bienvenidos!', 256, 52);
  });
  const banner = add(new THREE.PlaneGeometry(10, 1.9), new THREE.MeshStandardMaterial({ map: hello, roughness: 0.6 }), fx + 14, 9.4, fz + 7.52, false);
  banner.rotation.x = -0.25;
  for (let i = 0; i < 3; i++) {
    box(16, 0.35, 1.4, paving, fx + 14, 0.18 + i * 0.35, fz + 9.2 - i * 1.3);
    box(16, 0.08, 0.25, mat(C.sun), fx + 14, 0.37 + i * 0.35, fz + 9.85 - i * 1.3, false);
  }

  // Playa de estacionamiento frente a la avenida
  box(76, 0.12, 26, mat(C.asphalt), -2, 0.06, 45, false);
  for (let i = 0; i < 12; i++) box(0.2, 0.13, 5, mat(C.snow), -36 + i * 6, 0.08, 51, false);
  const carCols = [C.wall, C.navy2, C.red, C.asphalt, C.gold, C.wall, C.night, C.red];
  carCols.forEach((col, i) => { if (i % 3 === 1) return; const cx = -33 + i * 6; box(2.2, 1.3, 4.2, mat(col, { roughness: 0.4, metalness: 0.3 }), cx, 0.8, 51); box(1.9, 0.8, 2.2, glass, cx, 1.8, 50.8, false); });
  for (let x = -40; x <= 30; x += 10) tree(x, 31.5, 0.8);

  // Cerco hacia la Av. Alfonso Ugarte: paneles con marco azul y reja oscura
  box(116, 1.2, 0.8, mat(C.stone), -12, 0.6, 63);
  for (let x = -66; x <= 36; x += 12) {
    box(6, 4.4, 0.5, navy2, x, 3.2, 63);
    box(5, 3.4, 0.55, wall, x, 3.2, 63, false);
    box(6, 0.15, 0.15, night, x + 6, 4.6, 63, false);
    for (let k = 1; k < 6; k++) box(0.12, 3.6, 0.12, night, x + 3 + k, 2.9, 63, false);
  }

  // Puerta 517 con el mural de volcanes en piedra
  const gx2 = 45, gz2 = 60;
  box(14, 8, 1.4, wall, gx2 - 6, 4, gz2);
  const mural = canvasTex(512, 300, (ctx) => {
    ctx.fillStyle = cssVar('--campus-stone');
    const tri = (x: number, y: number, w: number, h: number) => { ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + w / 2, y); ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fill(); };
    tri(20, 120, 200, 180); tri(150, 40, 230, 260); tri(310, 110, 190, 190);
  });
  add(new THREE.PlaneGeometry(13, 6), new THREE.MeshStandardMaterial({ map: mural, transparent: true, roughness: 0.9 }), gx2 - 6, 3.2, gz2 + 0.72, false);
  const plate = canvasTex(512, 160, (ctx) => {
    ctx.fillStyle = cssVar('--campus-stone'); ctx.fillRect(0, 0, 512, 160);
    ctx.fillStyle = white; ctx.font = font(84); ctx.textBaseline = 'alphabetic';
    ctx.fillText('La', 40, 100); star(ctx, 190, 72, 34); ctx.fillText('Salle', 236, 100);
    ctx.font = font(38, 700); ctx.fillText('Universidad', 236, 145);
  });
  box(9, 2.8, 0.6, mat(C.stone), gx2 - 7, 9.2, gz2);
  add(new THREE.PlaneGeometry(8.6, 2.6), new THREE.MeshStandardMaterial({ map: plate, roughness: 0.6 }), gx2 - 7, 9.2, gz2 + 0.32, false);
  box(1.6, 10, 1.6, mat(C.orange), gx2 - 14, 5, gz2);
  box(1.4, 7, 1.4, mat(C.orange), gx2 + 2, 3.5, gz2);
  box(1.4, 7, 1.4, mat(C.orange), gx2 + 14, 3.5, gz2);
  box(14, 1.4, 3, mat(C.orange), gx2 + 8, 7.5, gz2);
  const num = canvasTex(256, 96, (ctx) => { ctx.fillStyle = white; ctx.font = font(72); ctx.textBaseline = 'middle'; ctx.fillText('517', 70, 52); });
  add(new THREE.PlaneGeometry(3.2, 1.2), new THREE.MeshStandardMaterial({ map: num, transparent: true }), gx2 + 12, 7.5, gz2 + 1.52, false);
  for (let i = 0; i < 9; i++) box(0.25, 5.5, 0.25, night, gx2 + 3 + i * 1.3, 2.75, gz2, false);
  box(12, 0.12, 30, mat(C.asphalt), gx2 + 8, 0.07, 44, false);

  // Árboles a orillas del río Chili
  for (let x = -70; x <= 70; x += 8) tree(x, -74 + (x % 16 === 0 ? 1.5 : -1), 1.15);

  // Volcanes de Arequipa al fondo: Misti, Chachani y Pichu Pichu (sin niebla para que se vean nítidos)
  const rock = mat(C.mountain, { fog: false, flatShading: true });
  const snow = mat(C.snow, { fog: false, flatShading: true });
  function volcano(x: number, z: number, r: number, h: number, cap: number) {
    add(new THREE.ConeGeometry(r, h, 28), rock, x, h / 2 - 2, z, false);
    add(new THREE.ConeGeometry(r * cap, h * cap + 0.5, 28), snow, x, h - (h * cap) / 2 - 2 + 0.3, z, false);
  }
  volcano(-20, -330, 120, 95, 0.24);
  volcano(-260, -380, 150, 80, 0.2);
  volcano(230, -360, 120, 55, 0.15);

  // Luces
  scene.add(new THREE.HemisphereLight(C.sky, C.paving, 1.4));
  const sun = new THREE.DirectionalLight(C.snow, 2.2);
  sun.position.set(60, 90, 50);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -110, right: 110, top: 110, bottom: -110, near: 10, far: 300 });
  scene.add(sun);
}

export default function Campus() {
  const mount = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLButtonElement | null)[]>([]);
  const fly = useRef<(cam: [number, number, number], target: [number, number, number]) => void>(() => {});
  const [sel, setSel] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [webgl] = useState(hasWebGL);
  const events = useApi<any[]>('/events');

  useEffect(() => {
    const el = mount.current;
    if (!el || !webgl) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.5, 1400);
    camera.position.set(...HOME_CAM);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...HOME_TARGET);
    controls.enableDamping = true;
    controls.minDistance = 18;
    controls.maxDistance = 230;
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.autoRotate = !reduce;
    controls.autoRotateSpeed = 0.5;
    controls.addEventListener('start', () => { controls.autoRotate = false; });
    buildCampus(scene);

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let anim: { from: THREE.Vector3; to: THREE.Vector3; tFrom: THREE.Vector3; tTo: THREE.Vector3; t0: number } | null = null;
    fly.current = (cam, target) => {
      controls.autoRotate = false;
      anim = { from: camera.position.clone(), to: new THREE.Vector3(...cam), tFrom: controls.target.clone(), tTo: new THREE.Vector3(...target), t0: performance.now() };
    };

    const v = new THREE.Vector3();
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      if (anim) {
        const k = reduce ? 1 : Math.min(1, (now - anim.t0) / 1100);
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        camera.position.lerpVectors(anim.from, anim.to, e);
        controls.target.lerpVectors(anim.tFrom, anim.tTo, e);
        if (k >= 1) anim = null;
      }
      controls.update();
      renderer.render(scene, camera);
      const w = el.clientWidth, h = el.clientHeight;
      PLACES.forEach((p, i) => {
        const b = labels.current[i];
        if (!b) return;
        v.set(...p.pos).project(camera);
        const visible = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
        b.style.opacity = visible ? '1' : '0';
        b.style.pointerEvents = visible ? 'auto' : 'none';
        b.style.transform = `translate(-50%, -100%) translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px)`;
      });
    };
    raf = requestAnimationFrame(loop);
    setReady(true);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mm = m.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mm) ? mm : mm ? [mm] : []).forEach((x) => x.dispose());
      });
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, [webgl]);

  function open(i: number) {
    setSel(i);
    const p = PLACES[i];
    fly.current(p.cam, p.pos);
  }
  function reset() {
    setSel(null);
    fly.current(HOME_CAM, HOME_TARGET);
  }

  const place = sel === null ? null : PLACES[sel];
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const here = useMemo(() => {
    if (!place) return [];
    return (events.data ?? []).filter((e) => place.keywords.some((k) => norm(`${e.place ?? ''} ${e.title ?? ''}`).includes(norm(k)))).slice(0, 3);
  }, [place, events.data]);

  return (
    <div className="page campus-page">
      <header className="campus-head">
        <span className="post-ico gold"><MapPin size={20} /></span>
        <div>
          <h1>Campus 3D</h1>
          <p className="muted">ULASALLE Arequipa · Av. Alfonso Ugarte 517. Gira con el dedo, acerca con dos dedos y toca un lugar.</p>
        </div>
      </header>

      <div className="campus-stage">
        {webgl ? <div className="campus-canvas" ref={mount} aria-label="Maqueta 3D del campus de ULASALLE Arequipa" role="img" /> : (
          <div className="campus-fallback">Tu navegador no puede mostrar 3D. Igual puedes recorrer los lugares de abajo.</div>
        )}
        {webgl && PLACES.map((p, i) => {
          const Icon = p.icon;
          return (
            <button key={p.id} ref={(b) => { labels.current[i] = b; }} className={`campus-pin ${sel === i ? 'on' : ''}`} onClick={() => open(i)} style={{ opacity: 0 }}>
              <Icon size={15} /> {p.name}
            </button>
          );
        })}
        {webgl && !ready && <div className="campus-loading">Armando el campus...</div>}
        <div className="campus-tools">
          <button onClick={reset} aria-label="Ver todo el campus"><HomeIcon size={18} /></button>
          <button onClick={() => open(sel === null ? 0 : (sel + PLACES.length - 1) % PLACES.length)} aria-label="Lugar anterior"><ChevronLeft size={18} /></button>
          <button className="tour" onClick={() => open(sel === null ? 0 : (sel + 1) % PLACES.length)}><Eye size={16} /> {sel === null ? 'Recorrido' : 'Siguiente'}</button>
          <button onClick={() => open(sel === null ? 0 : (sel + 1) % PLACES.length)} aria-label="Lugar siguiente"><ChevronRight size={18} /></button>
        </div>

        {place && (
          <section className="campus-card" aria-live="polite">
            <button className="campus-x" onClick={reset} aria-label="Cerrar"><X size={18} /></button>
            {place.photo && <img src={place.photo} alt={`Foto de ${place.name} en ULASALLE`} loading="lazy" />}
            <div className="campus-card-body">
              <h2><place.icon size={18} /> {place.name}</h2>
              <p>{place.text}</p>
              {here.length > 0 && (
                <ul className="campus-events">
                  {here.map((e) => <li key={e.id}><CalendarDays size={14} /> <strong>{e.title}</strong> · {when(e.starts_at)}</li>)}
                </ul>
              )}
              <div className="campus-actions">
                {place.actions.map((a) => <Link key={a.to + a.label} to={a.to} className="campus-go">{a.label} <ChevronRight size={15} /></Link>)}
              </div>
            </div>
          </section>
        )}
      </div>

      <div className="campus-list">
        {PLACES.map((p, i) => {
          const Icon = p.icon;
          return <button key={p.id} className={sel === i ? 'on' : ''} onClick={() => open(i)}><Icon size={16} /> {p.name}</button>;
        })}
      </div>

      <p className="campus-note">Maqueta referencial hecha a partir de fotos del campus, no es un plano exacto. Las fotos se usan sin personas reconocibles.</p>
    </div>
  );
}

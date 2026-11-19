import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BookOpen, CalendarDays, DoorOpen, ChevronLeft, ChevronRight, Coffee, Eye, Footprints, GraduationCap, Home as HomeIcon, MapPin, Mountain, Music2, TreePine, X } from 'lucide-react';
import { useApi } from '../lib/useApi';
import { when } from '../lib/format';

// Campus 3D de ULASALLE Arequipa (Av. Alfonso Ugarte 517). Es una maqueta simple hecha
// a partir de fotos del campus: no es un plano exacto. Cada lugar conecta con Parche.
type Place = {
  id: string; name: string; icon: typeof MapPin; pos: [number, number, number]; cam: [number, number, number];
  text: string; photo?: string; keywords: string[]; actions: { label: string; to: string }[];
};

const PLACES: Place[] = [
  { id: 'frontis', name: 'Frontis e ingreso', icon: DoorOpen, pos: [-34, 15, 56], cam: [-12, 16, 104],
    text: 'La entrada principal de ULASALLE: el muro rojo con el logo, las columnas azules y el "¡Bienvenidos!". Aquí empieza tu recorrido por el campus.',
    photo: '/img/campus-frontis.jpg', keywords: ['frontis', 'ingreso', 'entrada', 'recepcion', 'recepción'],
    actions: [{ label: 'Ver comunidades', to: '/comunidades' }, { label: 'Pedir ayuda', to: '/mentoria/nueva' }] },
  { id: 'puerta', name: 'Puerta 517', icon: MapPin, pos: [44, 10, 58], cam: [64, 14, 100],
    text: 'El ingreso por la Av. Alfonso Ugarte 517, con el mural de los volcanes hecho en piedra.',
    photo: '/img/campus-puerta.jpg', keywords: ['puerta', 'porteria', 'portería', 'alfonso ugarte'],
    actions: [{ label: 'Ver el mapa de la red', to: '/mapa' }] },
  { id: 'pabellon', name: 'Pabellón de aulas', icon: GraduationCap, pos: [-6, 15, -14], cam: [-6, 24, 34],
    text: 'Aulas y laboratorios en varios pisos, con pasillos abiertos y vista al jardín. Si te trabas en un curso, pide ayuda y le llega a quien domina el tema.',
    photo: '/img/campus-pabellon.jpg', keywords: ['aula', 'pabellon', 'laboratorio', 'lab'],
    actions: [{ label: 'Pedir ayuda en un curso', to: '/mentoria/nueva' }, { label: 'Ver mentorías', to: '/mentoria' }] },
  { id: 'pasillo', name: 'Pasillos con vista', icon: Footprints, pos: [22, 9, -6.5], cam: [44, 16, 16],
    text: 'Los corredores del pabellón dan al jardín y a la ciudad. Buen punto para encontrarte con tu grupo antes de clase.',
    photo: '/img/campus-pasillo.jpg', keywords: ['pasillo', 'corredor'],
    actions: [{ label: 'Buscar un grupo de estudio', to: '/comunidades' }] },
  { id: 'jardin', name: 'Jardín central', icon: TreePine, pos: [-4, 1.5, 12], cam: [-26, 20, 42],
    text: 'La gran área verde del campus, con las letras gigantes de La Salle. Aquí se arman tertulias, picnics de bienvenida y actividades de comunidades.',
    photo: '/img/campus-letras.jpg', keywords: ['jardin', 'jardín', 'area verde', 'patio'],
    actions: [{ label: 'Ver comunidades', to: '/comunidades' }, { label: 'Crear una comunidad', to: '/comunidades/nueva' }] },
  { id: 'glorieta', name: 'Glorieta', icon: BookOpen, pos: [10, 6, 14], cam: [26, 12, 34],
    text: 'La glorieta de madera en medio del jardín: sombra, mesas y aire libre para estudiar en grupo o repasar antes de un examen.',
    keywords: ['glorieta', 'kiosko'],
    actions: [{ label: 'Ofrecer ayuda', to: '/mentoria' }] },
  { id: 'cafeteria', name: 'Terraza cafetería', icon: Coffee, pos: [-30, 18, -14], cam: [-50, 34, 12],
    text: 'Mesas bajo techo con vista a los volcanes. El lugar clásico para un café entre clases o para cerrar un trabajo en grupo.',
    photo: '/img/campus-cafeteria.jpg', keywords: ['cafeteria', 'cafetería', 'terraza', 'comedor'],
    actions: [{ label: 'Armar un grupo de estudio', to: '/comunidades/nueva' }] },
  { id: 'eventos', name: 'Terraza de eventos', icon: Music2, pos: [32, 14, 10], cam: [60, 26, 34],
    text: 'Explanada abierta para danzas, ferias y actividades culturales, con la ciudad de fondo.',
    keywords: ['explanada', 'eventos', 'feria', 'danza', 'auditorio', 'terraza'],
    actions: [{ label: 'Ver retos y eventos', to: '/retos' }] },
  { id: 'misti', name: 'Mirador al Misti', icon: Mountain, pos: [-20, 70, -330], cam: [10, 18, 40],
    text: 'Desde los pisos altos se ven el Misti y el Chachani. Arequipa es la sede peruana de la red La Salle en Parche.',
    keywords: ['mirador'],
    actions: [{ label: 'La Salle hoy: Arequipa', to: '/noticias' }] },
];

const HOME_CAM: [number, number, number] = [70, 55, 90];
const HOME_TARGET: [number, number, number] = [0, 6, 0];

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
    snow: cssColor('--campus-snow'), red: cssColor('--campus-red'), orange: cssColor('--campus-orange'), stone: cssColor('--campus-stone'), asphalt: cssColor('--campus-asphalt'), navy: cssColor('--navy'), navy2: cssColor('--navy2'), gold: cssColor('--gold'), sun: cssColor('--sun'), night: cssColor('--night'),
  };
  scene.background = C.sky;
  scene.fog = new THREE.Fog(C.sky, 180, 520);

  const mat = (color: THREE.Color, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, shadow = true) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = shadow; mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  };

  const wall = mat(C.wall), navy = mat(C.navy), navy2 = mat(C.navy2), wood = mat(C.wood), paving = mat(C.paving), night = mat(C.night, { roughness: 0.3, metalness: 0.2 });
  const glass = new THREE.MeshStandardMaterial({ color: C.glass, transparent: true, opacity: 0.45, roughness: 0.1, metalness: 0.1 });

  // Suelo: la ciudad alrededor, patios y área verde
  add(new THREE.CircleGeometry(700, 48).rotateX(-Math.PI / 2), mat(C.mountain, { fog: false }), 0, -1.2, -150, false);
  add(new THREE.CircleGeometry(260, 48).rotateX(-Math.PI / 2), mat(C.paving), 0, -1.1, 0, false);
  add(new THREE.BoxGeometry(170, 1, 120), paving, 0, -0.5, 0, false);
  add(new THREE.BoxGeometry(64, 0.3, 30), mat(C.grass), 0, 0.15, 14, false);
  add(new THREE.BoxGeometry(4, 0.32, 30), paving, -12, 0.17, 14, false);

  // Pabellón principal: blanco, con franjas azules y balcones de vidrio
  function pabellon(x: number, z: number, length: number, floors: number, rotY = 0) {
    const g = new THREE.Group();
    const h = 3.6, depth = 12;
    const body = new THREE.Mesh(new THREE.BoxGeometry(length, floors * h, depth), wall);
    body.position.y = (floors * h) / 2; body.castShadow = body.receiveShadow = true; g.add(body);
    const winGeo = new THREE.BoxGeometry(2.2, 1.6, 0.2);
    const cols = Math.floor(length / 3.4);
    const wins = new THREE.InstancedMesh(winGeo, night, cols * floors);
    const m4 = new THREE.Matrix4();
    let k = 0;
    for (let f = 0; f < floors; f++) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(length + 0.4, 0.45, depth + 3.2), navy);
      slab.position.set(0, f * h + 0.2, 1.4); slab.castShadow = slab.receiveShadow = true; g.add(slab);
      if (f > 0) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 1.1, 0.12), glass);
        rail.position.set(0, f * h + 0.95, depth / 2 + 2.9); g.add(rail);
      }
      for (let c = 0; c < cols; c++) {
        m4.makeTranslation(-length / 2 + 1.7 + c * 3.4, f * h + 2, depth / 2 + 0.05);
        wins.setMatrixAt(k++, m4);
      }
    }
    const roof = new THREE.Mesh(new THREE.BoxGeometry(length + 0.6, 0.5, depth + 3.6), navy2);
    roof.position.set(0, floors * h + 0.25, 1.2); roof.castShadow = true; g.add(roof);
    g.add(wins);
    g.position.set(x, 0, z); g.rotation.y = rotY;
    scene.add(g);
  }
  pabellon(-6, -14, 64, 4);
  pabellon(32, -2, 30, 3, -Math.PI / 2);

  // Terraza cafetería: techo sobre columnas y mesas, encima del pabellón
  const cafY = 4 * 3.6 + 0.5;
  add(new THREE.BoxGeometry(18, 0.4, 14), wall, -30, cafY + 4, -14);
  for (const [cx, cz] of [[-38, -8], [-30, -8], [-22, -8], [-38, -20], [-22, -20]]) add(new THREE.CylinderGeometry(0.25, 0.25, 4, 10), mat(C.paving, { metalness: 0.5, roughness: 0.4 }), cx, cafY + 2, cz);
  for (let i = 0; i < 6; i++) add(new THREE.BoxGeometry(2.4, 0.9, 1.2), wood, -36 + (i % 3) * 5, cafY + 0.45, -16 + Math.floor(i / 3) * 5);
  add(new THREE.BoxGeometry(18, 1.1, 0.12), glass, -30, cafY + 0.6, -6.9, false);

  // Terraza de eventos sobre el segundo pabellón
  const evY = 3 * 3.6 + 0.5;
  add(new THREE.BoxGeometry(12, 1.1, 0.12), glass, 38.9, evY + 0.6, -2, false).rotation.y = Math.PI / 2;
  add(new THREE.CylinderGeometry(3, 3, 0.2, 24), mat(C.gold), 32, evY + 0.1, 4);

  // Glorieta de madera en el jardín
  const gx = 10, gz = 14;
  add(new THREE.CylinderGeometry(5, 5, 0.6, 8), wood, gx, 0.6, gz);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    add(new THREE.CylinderGeometry(0.22, 0.22, 3.6, 8), wood, gx + Math.cos(a) * 4.5, 2.7, gz + Math.sin(a) * 4.5);
  }
  add(new THREE.ConeGeometry(6.2, 2.6, 8), wood, gx, 5.8, gz);
  for (let i = 0; i < 7; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const r = add(new THREE.BoxGeometry(3.4, 0.7, 0.15), wood, gx + Math.cos(a) * 4.6, 1.3, gz + Math.sin(a) * 4.6);
    r.rotation.y = -a + Math.PI / 2;
  }

  // Edificios bajos con techos azules (al fondo, como en las fotos)
  for (const [bx, bz, w, d] of [[-60, 18, 18, 10], [-60, 36, 18, 10], [56, 30, 14, 12], [-40, 44, 22, 8]]) {
    add(new THREE.BoxGeometry(w, 4, d), wall, bx, 2, bz);
    const roof = add(new THREE.BoxGeometry(w + 1, 0.5, d + 1), navy2, bx, 4.3, bz);
    roof.rotation.z = 0.04;
  }

  // Calle y frontis de ULASALLE (Av. Alfonso Ugarte), según fotos del ingreso
  add(new THREE.BoxGeometry(260, 0.2, 12), mat(C.asphalt), 0, -0.05, 70, false);
  add(new THREE.BoxGeometry(170, 0.5, 4), paving, 0, 0.1, 62, false);
  const white = cssVar('--white'), font = (px: number, w = 800) => `${w} ${px}px Nunito, system-ui, sans-serif`;
  // Muro rojo con el logo de La Salle Universidad
  const fx = -42, fz = 50;
  add(new THREE.BoxGeometry(12, 14, 8), mat(C.red), fx, 7, fz);
  const logo = canvasTex(512, 512, (ctx) => {
    ctx.fillStyle = white; ctx.textBaseline = 'alphabetic';
    ctx.font = font(150); ctx.fillText('La', 40, 190); star(ctx, 330, 135, 72);
    ctx.fillText('Salle', 40, 340);
    ctx.font = font(64, 700); ctx.fillText('Universidad', 44, 430);
  });
  const sign = add(new THREE.PlaneGeometry(9, 9), new THREE.MeshStandardMaterial({ map: logo, transparent: true, roughness: 0.6 }), fx, 8.5, fz + 4.02, false);
  sign.receiveShadow = false;
  // Cuerpo vidriado con columnas azules y el letrero de bienvenida
  add(new THREE.BoxGeometry(24, 12, 7), mat(C.wall), fx + 18, 6, fz - 0.5);
  add(new THREE.BoxGeometry(22, 10, 0.3), glass, fx + 18, 5.5, fz + 3.1, false);
  for (let i = 0; i < 5; i++) add(new THREE.BoxGeometry(1.4, 13, 1.4), mat(C.navy2), fx + 8 + i * 5, 6.5, fz + 3.8);
  add(new THREE.BoxGeometry(12, 0.8, 4), mat(C.wall), fx + 14, 8.4, fz + 5.5);
  const hello = canvasTex(512, 96, (ctx) => {
    ctx.fillStyle = cssVar('--navy2'); ctx.fillRect(0, 0, 512, 96);
    ctx.fillStyle = white; ctx.font = font(58); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('¡Bienvenidos!', 256, 52);
  });
  const banner = add(new THREE.PlaneGeometry(10, 1.9), new THREE.MeshStandardMaterial({ map: hello, roughness: 0.6 }), fx + 14, 9.4, fz + 7.52, false);
  banner.rotation.x = -0.25;
  for (let i = 0; i < 3; i++) {
    add(new THREE.BoxGeometry(16, 0.35, 1.4), mat(C.paving), fx + 14, 0.18 + i * 0.35, fz + 9.2 - i * 1.3);
    add(new THREE.BoxGeometry(16, 0.08, 0.25), mat(C.sun), fx + 14, 0.37 + i * 0.35, fz + 9.85 - i * 1.3, false);
  }
  // Puerta 517 con el mural de volcanes en piedra
  const gx2 = 40, gz2 = 57;
  add(new THREE.BoxGeometry(14, 8, 1.4), mat(C.wall), gx2, 4, gz2);
  const mural = canvasTex(512, 300, (ctx) => {
    ctx.fillStyle = cssVar('--campus-stone');
    const tri = (x: number, y: number, w: number, h: number) => { ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + w / 2, y); ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fill(); };
    tri(20, 120, 200, 180); tri(150, 40, 230, 260); tri(310, 110, 190, 190);
  });
  add(new THREE.PlaneGeometry(13, 6), new THREE.MeshStandardMaterial({ map: mural, transparent: true, roughness: 0.9 }), gx2, 3.2, gz2 + 0.72, false);
  const plate = canvasTex(512, 160, (ctx) => {
    ctx.fillStyle = cssVar('--campus-stone'); ctx.fillRect(0, 0, 512, 160);
    ctx.fillStyle = white; ctx.font = font(84); ctx.textBaseline = 'alphabetic';
    ctx.fillText('La', 40, 100); star(ctx, 190, 72, 34); ctx.fillText('Salle', 236, 100);
    ctx.font = font(38, 700); ctx.fillText('Universidad', 236, 145);
  });
  add(new THREE.BoxGeometry(9, 2.8, 0.6), mat(C.stone), gx2 - 1, 9.2, gz2);
  add(new THREE.PlaneGeometry(8.6, 2.6), new THREE.MeshStandardMaterial({ map: plate, roughness: 0.6 }), gx2 - 1, 9.2, gz2 + 0.32, false);
  add(new THREE.BoxGeometry(1.6, 10, 1.6), mat(C.orange), gx2 - 8, 5, gz2);
  add(new THREE.BoxGeometry(1.4, 7, 1.4), mat(C.orange), gx2 + 8, 3.5, gz2);
  add(new THREE.BoxGeometry(1.4, 7, 1.4), mat(C.orange), gx2 + 20, 3.5, gz2);
  add(new THREE.BoxGeometry(14, 1.4, 3), mat(C.orange), gx2 + 14, 7.5, gz2);
  const num = canvasTex(256, 96, (ctx) => { ctx.fillStyle = white; ctx.font = font(72); ctx.textBaseline = 'middle'; ctx.fillText('517', 70, 52); });
  add(new THREE.PlaneGeometry(3.2, 1.2), new THREE.MeshStandardMaterial({ map: num, transparent: true }), gx2 + 18, 7.5, gz2 + 1.52, false);
  for (let i = 0; i < 9; i++) add(new THREE.BoxGeometry(0.25, 5.5, 0.25), mat(C.night), gx2 + 9 + i * 1.3, 2.75, gz2);

  // Letras gigantes de La Salle en el jardín
  const letters = canvasTex(1024, 256, (ctx) => {
    ctx.fillStyle = white; ctx.font = font(220); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('La Salle', 512, 140);
  });
  const lm = new THREE.MeshStandardMaterial({ map: letters, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.5 });
  for (let k = 0; k < 4; k++) add(new THREE.PlaneGeometry(22, 5.5), lm, -14, 2.9, 25 - k * 0.12, false).castShadow = true;

  // Árboles: copas redondas y cipreses
  const leaf = mat(C.tree), trunk = wood;
  const trees: [number, number, number][] = [];
  for (let i = 0; i < 16; i++) trees.push([-34 + (i % 8) * 9.5 + (i > 7 ? 4 : 0), 0, i > 7 ? 31 : -0.5 + (i % 2)]);
  for (let i = 0; i < 6; i++) trees.push([-42 - (i % 2) * 6, 0, 2 + i * 6]);
  for (const [tx, , tz] of trees) {
    add(new THREE.CylinderGeometry(0.3, 0.4, 2.4, 6), trunk, tx, 1.2, tz);
    add(new THREE.IcosahedronGeometry(2.6, 0), leaf, tx, 4, tz);
  }
  for (let i = 0; i < 8; i++) add(new THREE.ConeGeometry(1.4, 12, 8), leaf, -76 + i * 3.4, 6, 54);

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
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 10, far: 260 });
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
    controls.maxDistance = 190;
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

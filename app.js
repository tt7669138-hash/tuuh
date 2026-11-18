"use strict";
const slides=[...document.querySelectorAll('.page')];
const track=document.querySelector('#pages');
const select=document.querySelector('#page-select');
const prev=document.querySelector('#prev'),next=document.querySelector('#next');
const fullscreen=document.querySelector('#fullscreen'),dialog=document.querySelector('#text-dialog');
const indexDialog=document.querySelector('#index-dialog');
const preference=matchMedia('(prefers-reduced-motion: reduce)');
// Camera poses in presentation order, with angles in degrees and offsets in pixels.
const backdropMotion = [
 {pitch: -16, yaw: 28, roll: 6, panX: 10, panY: -9, zoom: 1.035, duration: 810}, // Cover
 {pitch: 0, yaw: 24, roll: 0, panX: 15, panY: 0, zoom: 1.022, duration: 610}, // Contents
 {pitch: 14, yaw: 38, roll: -6, panX: 12, panY: -9, zoom: 1.038, duration: 740}, // Historical context
 {pitch: 2, yaw: 42, roll: 4, panX: 17, panY: 0, zoom: 1.025, duration: 700}, // Timeline
 {pitch: 20, yaw: 12, roll: 1, panX: 5, panY: 13, zoom: 1.029, duration: 680}, // Administration
 {pitch: -4, yaw: 48, roll: -5, panX: 16, panY: 2, zoom: 1.029, duration: 720}, // Outer Mongolia
 {pitch: 5, yaw: 38, roll: 9, panX: 13, panY: 5, zoom: 1.027, duration: 670}, // Inner Mongolia
 {pitch: 12, yaw: 26, roll: 12, panX: 11, panY: 10, zoom: 1.045, duration: 755}, // Hulunbuir and Heilongjiang
 {pitch: -9, yaw: 18, roll: -2, panX: 4, panY: 3, zoom: 1.05, duration: 780}, // Kokonor
 {pitch: -15, yaw: 35, roll: -10, panX: 11, panY: -12, zoom: 1.049, duration: 730}, // Xinjiang
 {pitch: -21, yaw: 20, roll: 3, panX: 7, panY: -8, zoom: 1.032, duration: 650}, // System of control
 {pitch: -3, yaw: 49, roll: -4, panX: 13, panY: -2, zoom: 1.028, duration: 800}, // Education
 {pitch: 22, yaw: 10, roll: 5, panX: 3, panY: 7, zoom: 1.04, duration: 820}, // Religion and culture
 {pitch: 3, yaw: 27, roll: -13, panX: 13, panY: 1, zoom: 1.023, duration: 690}, // Literature
 {pitch: 34, yaw: 17, roll: -3, panX: 6, panY: 12, zoom: 1.046, duration: 770}, // Art and architecture
 {pitch: 14, yaw: 9, roll: 0, panX: 4, panY: 8, zoom: 1.021, duration: 625}, // Economy and taxes
 {pitch: 2, yaw: 47, roll: 7, panX: 18, panY: 0, zoom: 1.027, duration: 590}, // Borders and customs
 {pitch: 0, yaw: 19, roll: -7, panX: 10, panY: -2, zoom: 1.022, duration: 705}, // Scripts and languages
 {pitch: -15, yaw: 26, roll: 15, panX: 7, panY: 6, zoom: 1.036, duration: 760}, // Outcomes
 {pitch: -14, yaw: 15, roll: 5, panX: 5, panY: 12, zoom: 1.047, duration: 715}, // Cultural preservation
 {pitch: 12, yaw: 32, roll: -2, panX: 8, panY: 3, zoom: 1.031, duration: 685}, // Conclusion
 {pitch: 9, yaw: 11, roll: -5, panX: 5, panY: -6, zoom: 1.017, duration: 615}, // Sources
 {pitch: -24, yaw: 10, roll: -5, panX: 3, panY: -3, zoom: 1.016, duration: 840} // Closing
];
let current = 0;
let enabled = !preference.matches;
let scrollFrame = 0;
let scrollTarget = 0;
let lastWheelTime = -Infinity;
let wheelDistance = 0;
let wheelHandled = false;
function applyMotionPreference() {
 enabled = !preference.matches;
 document.body.classList.toggle('no-motion', !enabled);
 if (!enabled && current) {
  slides[current - 1].classList.remove('is-entering', 'jump-forward', 'jump-back');
  if (scrollTarget) go(scrollTarget);
 }
}
function syncFullscreen(){const active=Boolean(document.fullscreenElement),label=active?'Бүтэн дэлгэцээс гарах':'Дэлгэц дүүргэх';fullscreen.querySelector('.fullscreen-label').textContent=label;fullscreen.setAttribute('aria-pressed',String(active));fullscreen.setAttribute('aria-label',label);fullscreen.title=label;}
applyMotionPreference();
preference.addEventListener('change',applyMotionPreference);
if(document.fullscreenEnabled&&document.documentElement.requestFullscreen){
 fullscreen.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{fullscreen.title='Бүтэн дэлгэцийн горимд шилжиж чадсангүй';}});
}else{fullscreen.disabled=true;fullscreen.title='Бүтэн дэлгэцийн горим дэмжигдэхгүй байна';}
document.addEventListener('fullscreenchange',syncFullscreen);
syncFullscreen();
for (const group of track.querySelectorAll('.contents, .timeline, .hierarchy, .takeaways, .editorial-copy')) {
 const step = Math.min(90, 420 / Math.max(1, group.children.length - 1));
 Array.from(group.children).forEach((item, index) => {
  item.style.setProperty('--row-delay', `${index * step}ms`);
 });
}
function activateSlide(n, jumped = false) {
 if (n === current) return;
 backdrop.showSlide(n, current);
 const outgoing = slides[current - 1];
 const incoming = slides[n - 1];
 outgoing?.classList.remove('is-current', 'is-entering', 'jump-forward', 'jump-back');
 incoming.classList.add('is-current');
 if (enabled) {
  incoming.classList.add('is-entering');
  if (jumped) incoming.classList.add(n > current ? 'jump-forward' : 'jump-back');
 }
 current = n;
 select.value = String(n);
 prev.disabled = n === 1;
 next.disabled = n === slides.length;
 document.body.style.setProperty('--reading-progress', String(n / slides.length));
}
function go(n) {
 n = Math.max(1, Math.min(slides.length, n));
 const width = track.clientWidth;
 const left = (n - 1) * width;
 const distance = Math.abs(left - track.scrollLeft);
 const jumped = distance > width * 1.1;
 const smooth = enabled && !jumped && distance >= 1;
 scrollTarget = smooth ? n : 0;
 track.scrollTo({left, behavior: smooth ? 'smooth' : 'instant'});
 activateSlide(n, jumped);
 history.replaceState(null, '', '#page-' + n);
}
function syncFromScroll() {
 scrollFrame = 0;
 const width = track.clientWidth;
 const left = track.scrollLeft;
 if (!width) return;
 if (scrollTarget) {
  if (Math.abs(left - (scrollTarget - 1) * width) >= 1) return;
  scrollTarget = 0;
 }
 const page = Math.max(0, Math.min(slides.length - 1, Math.round(left / width)));
 activateSlide(page + 1);
}
function scrollWithWheel(event) {
 if (event.ctrlKey) return;
 const mode = event.deltaMode;
 const {deltaX, deltaY} = event;
 if (Math.abs(deltaX) > Math.abs(deltaY)) {
  scrollTarget = 0;
  return;
 }
 if (!deltaY) return;
 if (event.timeStamp - lastWheelTime > 180) {
  wheelDistance = 0;
  wheelHandled = false;
 }
 lastWheelTime = event.timeStamp;
 const page = event.target.closest('.page');
 const canScrollPage = page && (deltaY > 0
  ? page.scrollTop + page.clientHeight < page.scrollHeight - 1
  : page.scrollTop > 1);
 if (canScrollPage) {
  wheelHandled = true;
  return;
 }
 event.preventDefault();
 if (wheelHandled) return;
 if (Math.sign(wheelDistance) !== Math.sign(deltaY)) wheelDistance = 0;
 const unit = mode === 1 ? 16 : mode === 2 ? track.clientHeight : 1;
 wheelDistance += deltaY * unit;
 if (Math.abs(wheelDistance) < 40) return;
 wheelHandled = true;
 go(current + Math.sign(wheelDistance));
}
select.addEventListener('change',()=>go(Number(select.value)));
prev.addEventListener('click',()=>go(current-1));next.addEventListener('click',()=>go(current+1));
track.addEventListener('scroll', () => {
 if (!scrollFrame) scrollFrame = requestAnimationFrame(syncFromScroll);
}, {passive: true});
track.addEventListener('pointerdown', () => { scrollTarget = 0; }, {passive: true});
track.addEventListener('wheel', scrollWithWheel, {passive: false});
document.querySelectorAll('a[href^="#page-"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();if(indexDialog.open)indexDialog.close();go(Number(a.hash.slice(6)));}));
document.addEventListener('keydown',e=>{if(dialog.open||indexDialog.open||['SELECT','BUTTON','INPUT','TEXTAREA','A'].includes(document.activeElement.tagName)||e.altKey||e.ctrlKey||e.metaKey)return;const action={ArrowRight:current+1,PageDown:current+1,ArrowLeft:current-1,PageUp:current-1,Home:1,End:slides.length}[e.key];if(action!==undefined){e.preventDefault();go(action);}});
document.querySelector('#text-open').addEventListener('click',()=>{document.querySelector('#text-title').textContent=current+'-р хуудасны эх бичвэр';document.querySelector('#source-text').textContent=window.sourcePages[current-1];dialog.showModal();});
document.querySelector('#text-close').addEventListener('click',()=>dialog.close());
document.querySelector('#menu-open').addEventListener('click',()=>indexDialog.showModal());
document.querySelector('#menu-close').addEventListener('click',()=>indexDialog.close());
[dialog,indexDialog].forEach(el=>el.addEventListener('click',e=>{if(e.target===el){const r=el.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)el.close();}}));
const backdrop = createCinematicBackdrop();
const initial = Number(location.hash.replace('#page-', ''));
const start = Number.isInteger(initial) && initial >= 1 && initial <= slides.length ? initial : 1;
if (start > 1) track.scrollTo({left: (start - 1) * track.clientWidth, behavior: 'instant'});
activateSlide(start);

function createCinematicBackdrop() {
 const root = document.createElement('div');
 root.className = 'cinematic-backdrop';
 root.setAttribute('aria-hidden', 'true');
 root.innerHTML = `
  <div class="backdrop-camera">
   <div class="backdrop-landscape"><div class="backdrop-monastery"></div></div>
   <div class="backdrop-mist"></div>
   <div class="compass-space">
    <div class="compass-turn">
     <div class="backdrop-compass">
      <div class="compass-dial"></div>
      <div class="compass-needle"></div>
     </div>
    </div>
   </div>
   <div class="backdrop-sparks"></div>
  </div>`;
 document.body.prepend(root);
 document.body.classList.add('has-cinematic-backdrop');

 const camera = root.firstElementChild;
 const compassTurn = root.querySelector('.compass-turn');
 const landscape = root.querySelector('.backdrop-landscape');
 const finePointer = matchMedia('(any-pointer: fine)');
 let slideTurns = [];
 let pointerFrame = 0;
 let panX = 0;
 let panY = 0;

 function cancelTurn() {
  for (const animation of slideTurns) animation.cancel();
  slideTurns = [];
 }

 function animateTurn(element, start, peak, duration) {
  return element.animate([
   {transform: start, easing: 'cubic-bezier(.24,.56,.34,1)'},
   {transform: peak, offset: .41, easing: 'cubic-bezier(.2,.75,.25,1)'},
   {transform: 'none'}
  ], duration);
 }

 function showSlide(n, previous) {
  root.classList.toggle('is-culture', n >= 12 && n <= 15);
  if (!previous || !enabled || document.hidden || !compassTurn.animate) return;

  const direction = n > previous ? 1 : -1;
  const {pitch, yaw, roll, panX, panY, zoom, duration} = backdropMotion[n - 1] ?? backdropMotion[0];
  const turning = slideTurns.some(animation => animation.playState === 'running');
  const compassStart = turning ? getComputedStyle(compassTurn).transform : 'none';
  const landscapeStart = turning ? getComputedStyle(landscape).transform : 'none';
  cancelTurn();
  const compassPeak = `translateX(${-direction * panX * 1.5}px) rotateX(${pitch}deg) rotateY(${-direction * yaw}deg) rotateZ(${direction * roll}deg)`;
  const landscapePeak = `translate3d(${-direction * panX}px, ${panY}px, 0) scale(${zoom})`;
  slideTurns = [
   animateTurn(compassTurn, compassStart, compassPeak, duration),
   animateTurn(landscape, landscapeStart, landscapePeak, duration)
  ];
 }

 function updateCamera() {
  pointerFrame = 0;
  camera.style.setProperty('--pan-x', `${panX.toFixed(2)}px`);
  camera.style.setProperty('--pan-y', `${panY.toFixed(2)}px`);
 }

 function resetCamera() {
  if (pointerFrame) cancelAnimationFrame(pointerFrame);
  panX = 0;
  panY = 0;
  updateCamera();
 }

 function syncVisibility() {
  document.body.classList.toggle('tab-hidden', document.hidden);
  if (document.hidden) {
   resetCamera();
   cancelTurn();
  }
 }

 window.addEventListener('pointermove', event => {
  if (!enabled || document.hidden || !finePointer.matches || event.pointerType === 'touch') return;
  panX = (event.clientX / window.innerWidth - 0.5) * 20;
  panY = (event.clientY / window.innerHeight - 0.5) * 14;
  if (!pointerFrame) pointerFrame = requestAnimationFrame(updateCamera);
 }, {passive: true});
 document.documentElement.addEventListener('pointerleave', resetCamera);
 window.addEventListener('blur', resetCamera);
 preference.addEventListener('change', () => {
  resetCamera();
  if (!enabled) cancelTurn();
 });
 document.addEventListener('visibilitychange', syncVisibility);
 syncVisibility();
 return {showSlide};
}

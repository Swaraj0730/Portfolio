const TOTAL_FRAMES = 240;
const LERP_EASE = 0.085;

const preloader = document.getElementById("preloader");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const progressCount = document.getElementById("progress-count");
const canvas = document.getElementById("animation-canvas");
const ctx = canvas.getContext("2d");
const railThumb = document.getElementById("hud-scroll-thumb");
const railPercent = document.getElementById("hud-scroll-percent");
const cursorLight = document.querySelector(".cursor-light");
const restartButton = document.getElementById("cta-restart");
const navLinks = document.querySelectorAll(".nav-links a");
const sections = document.querySelectorAll("[data-section]");
const reveals = document.querySelectorAll(".reveal");

const frames = [];
let loadedCount = 0;
let targetFrameProgress = 0;
let currentFrameProgress = 0;
let animationStarted = false;

const framePath = (index) => `./frames/ezgif-frame-${String(index).padStart(3, "0")}.jpg`;

function updateLoader() {
  const percent = Math.round((loadedCount / TOTAL_FRAMES) * 100);
  progressBar.style.width = `${percent}%`;
  progressText.textContent = `${percent}%`;
  progressCount.textContent = `${loadedCount} / ${TOTAL_FRAMES} frames`;
}

function preloadFrames() {
  return new Promise((resolve) => {
    for (let i = 1; i <= TOTAL_FRAMES; i += 1) {
      const image = new Image();
      image.src = framePath(i);
      frames[i - 1] = image;

      const markLoaded = () => {
        loadedCount += 1;
        updateLoader();
        if (loadedCount === TOTAL_FRAMES) resolve();
      };

      image.onload = markLoaded;
      image.onerror = markLoaded;
    }
  });
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  drawCurrentFrame();
}

function drawCover(image) {
  if (!image || !image.complete || !image.naturalWidth) return;

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  let drawWidth = canvasWidth;
  let drawHeight = canvasHeight;

  if (imageRatio > canvasRatio) {
    drawHeight = canvasHeight;
    drawWidth = drawHeight * imageRatio;
  } else {
    drawWidth = canvasWidth;
    drawHeight = drawWidth / imageRatio;
  }

  const x = (canvasWidth - drawWidth) / 2;
  const y = (canvasHeight - drawHeight) / 2;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.drawImage(image, x, y, drawWidth, drawHeight);
}

function drawCurrentFrame() {
  const frameIndex = Math.min(TOTAL_FRAMES - 1, Math.floor(currentFrameProgress * (TOTAL_FRAMES - 1)));
  drawCover(frames[frameIndex]);
}

function updateScrollState() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const pageProgress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
  targetFrameProgress = pageProgress;

  if (railThumb) railThumb.style.height = `${pageProgress * 100}%`;
  if (railPercent) railPercent.textContent = `${Math.round(pageProgress * 100)}%`;

  navLinks.forEach((link) => link.classList.remove("active"));
  let activeId = "";
  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.45 && rect.bottom >= window.innerHeight * 0.35) {
      activeId = section.id;
    }
  });

  const activeLink = document.querySelector(`.nav-links a[href="#${activeId}"]`);
  if (activeLink) activeLink.classList.add("active");
}

function render() {
  currentFrameProgress += (targetFrameProgress - currentFrameProgress) * LERP_EASE;
  drawCurrentFrame();
  requestAnimationFrame(render);
}

function initRevealAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
      }
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });

  reveals.forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index % 4, 3) * 90}ms`;
    observer.observe(element);
  });
}

function initPointerLight() {
  if (!cursorLight) return;

  window.addEventListener("pointermove", (event) => {
    cursorLight.style.left = `${event.clientX}px`;
    cursorLight.style.top = `${event.clientY}px`;
  }, { passive: true });
}

function initRestart() {
  if (!restartButton) return;

  restartButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

async function init() {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("scroll", updateScrollState, { passive: true });

  initRevealAnimations();
  initPointerLight();
  initRestart();

  await preloadFrames();
  currentFrameProgress = targetFrameProgress;
  drawCurrentFrame();
  updateScrollState();
  preloader.classList.add("is-hidden");

  if (!animationStarted) {
    animationStarted = true;
    requestAnimationFrame(render);
  }
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

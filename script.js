const SUPABASE_URL = "https://otooejlgiviktlwaravv.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90b29lamxnaXZpa3Rsd2FyYXZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDY2OTUsImV4cCI6MjA5MzAyMjY5NX0.ZI0rjBKnKbPOSoFrqr93psDiw6n6AwUAeaWqqnCthSg";

let DOWNLOAD_LINKS = {
  android: "",
  ios: "",
};
let VIDEO_URL = "";

// 默认 URL
const DEFAULT_ANDROID_URL = "https://apk.qiandaocdn.com/apk/release/app-v1.0-1-20260430151207/echo-personax-1.0-1-release.apk";
const DEFAULT_VIDEO_URL = "https://image.tensorartassets.com/operation/media/2026-04/38e771a2-2de1-4c2d-8205-4ddb084e01e9.mp4";

// 加载配置
async function loadConfigAndInit() {
  DOWNLOAD_LINKS.android = DEFAULT_ANDROID_URL;
  VIDEO_URL = DEFAULT_VIDEO_URL;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/config`, {
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
    });
    const configs = await res.json();
    const configMap = {};
    configs.forEach(c => { configMap[c.key] = c.value; });
    if (configMap.android_url) DOWNLOAD_LINKS.android = configMap.android_url;
    if (configMap.ios_url) DOWNLOAD_LINKS.ios = configMap.ios_url;
    if (configMap.video_url) VIDEO_URL = configMap.video_url;
  } catch (e) {}
  applySmartDownloadState();
  const heroVideo = document.getElementById("heroVideo");
  heroVideo.src = VIDEO_URL;
}

loadConfigAndInit();

// 从 URL 获取 ref 参数（分发链接名字）
const urlParams = new URLSearchParams(window.location.search);
const ref = urlParams.get("ref") || "direct";

// 把页面上的 Nia 替换成 ref 名字
if (ref !== "direct") {
  document.querySelectorAll(".brand-desc").forEach(el => {
    el.textContent = el.textContent.replace("Nia", ref);
  });
}

// 获取或生成设备 ID
function getDeviceId() {
  let id = localStorage.getItem("device_id");
  if (!id) {
    id = "d_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("device_id", id);
  }
  return id;
}

// 上报点击（去重：同一设备一天只记一次）
async function recordClick(platform) {
  const device_id = getDeviceId();
  const today = new Date().toISOString().split('T')[0];
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/clicks`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=ignore-duplicates"
      },
      body: JSON.stringify({ ref: "all", device_id, platform, date: today })
    });
  } catch (e) {}
}

const androidBtn = document.getElementById("androidBtn");
const iosBtn = document.getElementById("iosBtn");
const smartDownloadBtn = document.getElementById("smartDownloadBtn");
const singleButtonWrap = document.getElementById("singleButtonWrap");
const multiButtonWrap = document.getElementById("multiButtonWrap");
const iosGuide = document.getElementById("iosGuide");
const closeGuide = document.getElementById("closeGuide");

const ua = navigator.userAgent.toLowerCase();
const isIOS = /iphone|ipad|ipod/.test(ua);
const isAndroid = /android/.test(ua);
const inWechat = /micromessenger/.test(ua);
const inQQ = /qq\//.test(ua);

androidBtn.href = DOWNLOAD_LINKS.android;
iosBtn.href = DOWNLOAD_LINKS.ios;

function openIosGuide() {
  iosGuide.classList.add("open");
  iosGuide.setAttribute("aria-hidden", "false");
}

function closeIosGuide() {
  iosGuide.classList.remove("open");
  iosGuide.setAttribute("aria-hidden", "true");
}

function applySmartDownloadState() {
  if (isIOS) {
    singleButtonWrap.style.display = "block";
    multiButtonWrap.style.display = "none";
    if (DOWNLOAD_LINKS.ios) {
      // iOS 有配置，可以下载
      smartDownloadBtn.href = DOWNLOAD_LINKS.ios;
      smartDownloadBtn.textContent = "ดาวน์โหลดเลย · สร้างฟรี 30 ครั้ง/วัน";
      smartDownloadBtn.style.cursor = "pointer";
      smartDownloadBtn.style.opacity = "1";
    } else {
      // iOS 无配置，显示敬请期待
      smartDownloadBtn.href = "#";
      smartDownloadBtn.textContent = "รองรับเฉพาะอุปกรณ์ Android · iOS ยังไม่ได้รองรับ";
      smartDownloadBtn.style.cursor = "not-allowed";
      smartDownloadBtn.style.opacity = "0.6";
      smartDownloadBtn.onclick = (e) => e.preventDefault();
    }
    return;
  }
  if (isAndroid) {
    singleButtonWrap.style.display = "block";
    multiButtonWrap.style.display = "none";
    smartDownloadBtn.href = DOWNLOAD_LINKS.android;
    smartDownloadBtn.textContent = "ดาวน์โหลดเลย · สร้างฟรี 30 ครั้ง/วัน";
    smartDownloadBtn.style.cursor = "pointer";
    smartDownloadBtn.style.opacity = "1";
    return;
  }
  // 桌面端：默认下载安卓
  singleButtonWrap.style.display = "block";
  multiButtonWrap.style.display = "none";
  smartDownloadBtn.href = DOWNLOAD_LINKS.android;
  smartDownloadBtn.textContent = "ดาวน์โหลดเลย · สร้างฟรี 30 ครั้ง/วัน";
  smartDownloadBtn.style.cursor = "pointer";
  smartDownloadBtn.style.opacity = "1";
}

smartDownloadBtn.addEventListener("click", (e) => {
  if (isIOS) return;
  recordClick("android");
  if (inWechat || inQQ) {
    e.preventDefault();
  }
});

androidBtn.addEventListener("click", () => recordClick("android"));
iosBtn.addEventListener("click", (e) => {
  recordClick("ios");
  if (inWechat || inQQ) {
    e.preventDefault();
    openIosGuide();
  }
});

closeGuide.addEventListener("click", closeIosGuide);
iosGuide.addEventListener("click", (e) => {
  if (e.target === iosGuide) closeIosGuide();
});

applySmartDownloadState();

// 强制触发视频自动播放
const heroVideo = document.querySelector(".hero-video");
if (heroVideo) {
  heroVideo.play().catch(() => {
    document.addEventListener("click", () => heroVideo.play(), { once: true });
  });
}

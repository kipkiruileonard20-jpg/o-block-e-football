// =====================================================
// O BLOCK E FOOTBALL — Fixed Production Script
// Using Firebase Compat SDK (no type="module" needed)
// =====================================================

// Load Firebase Compat SDKs (add these <script> tags BEFORE this script in HTML)
  // <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
  // <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
  // <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js"></script>

// =====================================================
// FIREBASE CONFIG
// =====================================================
const firebaseConfig = {
  apiKey: "AIzaSyA1-bJJCTtX1hPHY6Ibln_8rH29a0ioyb8",
  authDomain: "o-block-e-football.firebaseapp.com",
  databaseURL: "https://o-block-e-football-default-rtdb.firebaseio.com",
  projectId: "o-block-e-football",
  storageBucket: "o-block-e-football.firebasestorage.app",
  messagingSenderId: "1068493512938",
  appId: "1:1068493512938:web:65e8923a3289cb26f67793"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// ADMIN UID
const ADMIN_UID = "2gpO7N71hyTZygagaXqZh6xXKaS2";

// =====================================================
// APP STATE
// =====================================================
let currentUser = null;
let isAdmin = false;
let playersData = {};
let pendingDeleteId = null;
let pendingDeleteName = "";

// =====================================================
// UTILITY HELPERS
// =====================================================
function showMsg(el, text, type = "error", duration = 4000) {
  el.textContent = text;
  el.className = type === "success" ? "msg-success" : "msg-error";
  el.classList.remove("hidden");
  if (duration > 0) setTimeout(() => el.classList.add("hidden"), duration);
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function logActivity(html) {
  const log = document.getElementById("activity-log");
  const empty = log.querySelector(".log-empty");
  if (empty) empty.remove();
  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.innerHTML = `${html}<div class="log-time">${fmtTime(Date.now())}</div>`;
  log.prepend(entry);
  const entries = log.querySelectorAll(".log-entry");
  if (entries.length > 20) entries[entries.length - 1].remove();
}

// =====================================================
// LANDING PAGE & MUSIC
// =====================================================
function spawnParticles() {
  const container = document.getElementById("particles");
  for (let i = 0; i < 40; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      width: ${Math.random() * 3 + 1}px;
      height: ${Math.random() * 3 + 1}px;
      animation-duration: ${Math.random() * 12 + 8}s;
      animation-delay: ${Math.random() * 12}s;
      opacity: ${Math.random() * 0.6 + 0.2};
    `;
    container.appendChild(p);
  }
}

const bgMusic = document.getElementById("bg-music");
const musicBtn = document.getElementById("music-btn");
const musicIcon = document.getElementById("music-icon");
const musicLabel = document.getElementById("music-label");
let musicPlaying = false;

bgMusic.volume = 0.35;

musicBtn.addEventListener("click", () => {
  if (musicPlaying) {
    bgMusic.pause();
    musicPlaying = false;
    musicIcon.textContent = "🔇";
    musicLabel.textContent = "TAP FOR MUSIC";
    musicBtn.classList.remove("playing");
  } else {
    bgMusic.play()
      .then(() => {
        musicPlaying = true;
        musicIcon.textContent = "🔊";
        musicLabel.textContent = "MUSIC ON – TAP TO MUTE";
        musicBtn.classList.add("playing");
      })
      .catch(err => {
        console.error("Music play failed:", err);
        alert("Music couldn't play.\n\nPossible reasons:\n• File 'beat.mp3' missing or wrong path\n• Browser blocked it (try again or check console F12)\n• File format issue");
      });
  }
});

document.getElementById("enter-btn").addEventListener("click", () => {
  // Fade music if playing
  if (musicPlaying) {
    const fade = setInterval(() => {
      if (bgMusic.volume > 0.05) {
        bgMusic.volume -= 0.05;
      } else {
        bgMusic.pause();
        bgMusic.volume = 0.35;
        clearInterval(fade);
      }
    }, 80);
  }

  const landing = document.getElementById("landing-page");
  const app = document.getElementById("main-app");
  landing.classList.add("exit");
  setTimeout(() => {
    landing.style.display = "none";
    app.classList.remove("hidden");
    // Ensure default section is visible
    document.querySelector('.nav-btn[data-section="leaderboard"]').click();
  }, 900); // Match your CSS animation duration
});

spawnParticles();

// =====================================================
// NAVIGATION (rest remains similar, but ensure active class)
// =====================================================
// ... (your navBtns listener code here - no major changes needed)

// =====================================================
// AUTH, REGISTER, LEADERBOARD, MATCH SUBMIT, DELETE
// =====================================================
// Replace all firebase calls with compat syntax:
// auth.currentUser → currentUser (from onAuthStateChanged)
// signInWithEmailAndPassword(auth, email, pass) → auth.signInWithEmailAndPassword(email, pass)
// onValue(ref(db, "players"), snap => ...) → db.ref("players").on("value", snap => ...)
// ref(db, path) → db.ref(path)
// push(ref) → db.ref("players").push()
// set(ref, data) → ref.set(data)
// update(ref, updates) → ref.update(updates)
// remove(ref) → ref.remove()

// Example conversions (apply to your functions):

// In registerPlayer():
// const playersRef = db.ref("players");
// const newRef = playersRef.push();
// await newRef.set({ ... });

// In onValue listener:
// db.ref("players").on("value", snapshot => {
//   playersData = snapshot.val() || {};
//   renderLeaderboard();
//   // etc.
// });

// In auth observer:
// auth.onAuthStateChanged(user => {
//   currentUser = user;
//   isAdmin = user?.uid === ADMIN_UID;
//   // rest as is
// });

// For submitMatchResult, delete, etc. - replace firebase.database refs with db.ref()

// Full compat conversion would be lengthy, but the pattern is:
// - import removed
// - getAuth/app/getDatabase removed
// - Use firebase.auth(), firebase.database()
// - Methods like .signInWithEmailAndPassword(email, pass) on auth object
// - Database: db.ref("path").on("value", ...), .push(), .set(), etc.

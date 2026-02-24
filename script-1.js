// =====================================================
//  O BLOCK E FOOTBALL — Production Script
//  Firebase v9 Modular SDK
// =====================================================

// =====================================================
//  FIREBASE CONFIGURATION
//  Replace ALL values below with YOUR Firebase project details.
//  Get these from: Firebase Console → Project Settings → Your Apps → SDK Setup
// =====================================================
import { initializeApp }                          from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword,
         signOut, onAuthStateChanged }            from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, push, set, update,
         remove, onValue, get }                   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ── REPLACE THESE VALUES ──────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyA1-bJJCTtX1hPHY6Ibln_8rH29a0ioyb8",
  authDomain:        "o-block-e-football.firebaseapp.com",
  databaseURL:       "https://o-block-e-football-default-rtdb.firebaseio.com",
  projectId:         "o-block-e-football",
  storageBucket:     "o-block-e-football.firebasestorage.app",
  messagingSenderId: "1068493512938",
  appId:             "1:1068493512938:web:65e8923a3289cb26f67793"
};
// ─────────────────────────────────────────────────────

// ── ADMIN UID ─────────────────────────────────────────
// After creating your admin account in Firebase Auth,
// paste that user's UID here (Firebase Console → Authentication → Users → copy UID)
const ADMIN_UID = "2gpO7N71hyTZygagaXqZh6xXKaS2";
// ─────────────────────────────────────────────────────

// =====================================================
//  INITIALIZE FIREBASE
// =====================================================
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getDatabase(app);

// =====================================================
//  APP STATE
// =====================================================
let currentUser      = null;
let isAdmin          = false;
let playersData      = {};           // live cache from Firebase
let pendingDeleteId  = null;         // for confirm modal
let pendingDeleteName = "";

// =====================================================
//  UTILITY HELPERS
// =====================================================

/** Show a temporary message inside an element */
function showMsg(el, text, type = "error", duration = 4000) {
  el.textContent = text;
  el.className   = type === "success" ? "msg-success" : "msg-error";
  el.classList.remove("hidden");
  if (duration > 0) setTimeout(() => el.classList.add("hidden"), duration);
}

/** Format timestamp to readable time */
function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Add entry to the activity log */
function logActivity(html) {
  const log = document.getElementById("activity-log");
  const empty = log.querySelector(".log-empty");
  if (empty) empty.remove();

  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.innerHTML = `
    ${html}
    <div class="log-time">${fmtTime(Date.now())}</div>
  `;
  log.prepend(entry);

  // Keep max 20 entries
  const entries = log.querySelectorAll(".log-entry");
  if (entries.length > 20) entries[entries.length - 1].remove();
}

// =====================================================
//  LANDING PAGE
// =====================================================

/** Create floating particles */
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

// =====================================================
//  BACKGROUND MUSIC — Dark Trap Beat
// =====================================================
const bgMusic    = document.getElementById("bg-music");
const musicBtn   = document.getElementById("music-btn");
const musicIcon  = document.getElementById("music-icon");
const musicLabel = document.getElementById("music-label");
let musicPlaying = false;

bgMusic.volume = 0.35;

musicBtn.addEventListener("click", () => {
  if (musicPlaying) {
    bgMusic.pause();
    musicPlaying         = false;
    musicIcon.textContent  = "🔇";
    musicLabel.textContent = "TAP FOR MUSIC";
    musicBtn.classList.remove("playing");
  } else {
    bgMusic.play().then(() => {
      musicPlaying         = true;
      musicIcon.textContent  = "🔊";
      musicLabel.textContent = "MUSIC ON";
      musicBtn.classList.add("playing");
    }).catch(() => {});
  }
});

/** Enter Arena button */
document.getElementById("enter-btn").addEventListener("click", () => {
  // Fade music out smoothly
  if (musicPlaying) {
    const fadeOut = setInterval(() => {
      if (bgMusic.volume > 0.05) {
        bgMusic.volume = Math.max(0, bgMusic.volume - 0.05);
      } else {
        bgMusic.pause();
        bgMusic.volume = 0.35;
        clearInterval(fadeOut);
      }
    }, 80);
  }
  const landing = document.getElementById("landing-page");
  const app     = document.getElementById("main-app");
  landing.classList.add("exit");
  setTimeout(() => {
    landing.style.display = "none";
    app.classList.remove("hidden");
  }, 900);
});

// Update live player count on landing
function updateLandingCount(count) {
  const el = document.querySelector(".pill span");
  if (el) el.textContent = count;
}

// Init particles
spawnParticles();

// =====================================================
//  NAVIGATION
// =====================================================

const navBtns = document.querySelectorAll(".nav-btn");

navBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.section;
    navBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    document.getElementById(`section-${target}`).classList.add("active");
  });
});

// =====================================================
//  AUTHENTICATION
// =====================================================

const loginModal   = document.getElementById("login-modal");
const loginEmail   = document.getElementById("login-email");
const loginPass    = document.getElementById("login-password");
const loginError   = document.getElementById("login-error");
const adminBadge   = document.getElementById("admin-badge");
const btnLogin     = document.getElementById("btn-login");
const btnLogout    = document.getElementById("btn-logout");
const btnLoginSub  = document.getElementById("btn-login-submit");
const modalClose   = document.getElementById("modal-close");

btnLogin.addEventListener("click", () => {
  loginModal.classList.remove("hidden");
  loginEmail.focus();
});

modalClose.addEventListener("click", closeLoginModal);

loginModal.addEventListener("click", (e) => {
  if (e.target === loginModal) closeLoginModal();
});

function closeLoginModal() {
  loginModal.classList.add("hidden");
  loginError.classList.add("hidden");
  loginEmail.value = "";
  loginPass.value  = "";
}

btnLoginSub.addEventListener("click", async () => {
  const email = loginEmail.value.trim();
  const pass  = loginPass.value;

  if (!email || !pass) {
    showMsg(loginError, "Please enter email and password.");
    return;
  }

  btnLoginSub.disabled = true;
  btnLoginSub.textContent = "AUTHENTICATING...";

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    closeLoginModal();
  } catch (err) {
    let msg = "Login failed. Check credentials.";
    if (err.code === "auth/user-not-found")     msg = "No account found with this email.";
    if (err.code === "auth/wrong-password")      msg = "Incorrect password.";
    if (err.code === "auth/invalid-email")       msg = "Invalid email format.";
    if (err.code === "auth/too-many-requests")   msg = "Too many attempts. Try again later.";
    showMsg(loginError, msg);
  } finally {
    btnLoginSub.disabled = false;
    btnLoginSub.textContent = "ACCESS PANEL";
  }
});

// Allow Enter key in login fields
[loginEmail, loginPass].forEach(inp => {
  inp.addEventListener("keydown", e => {
    if (e.key === "Enter") btnLoginSub.click();
  });
});

btnLogout.addEventListener("click", () => signOut(auth));

// Auth state observer
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  isAdmin     = user?.uid === ADMIN_UID;

  // UI updates
  btnLogin.classList.toggle("hidden",    !!user);
  adminBadge.classList.toggle("hidden",  !isAdmin);

  // Show / hide admin nav
  document.querySelectorAll(".admin-only").forEach(el => {
    el.classList.toggle("hidden", !isAdmin);
  });

  // Re-render leaderboard to show/hide delete buttons
  renderLeaderboard();

  // If admin logged out while on admin section, go to leaderboard
  if (!isAdmin) {
    const adminSection = document.querySelector(".nav-btn[data-section='admin']");
    if (adminSection) adminSection.classList.remove("active");
    const leaderboardBtn = document.querySelector(".nav-btn[data-section='leaderboard']");
    if (leaderboardBtn) leaderboardBtn.click();
  }
});

// =====================================================
//  PLAYER REGISTRATION
// =====================================================

document.getElementById("btn-register").addEventListener("click", registerPlayer);
document.getElementById("reg-name").addEventListener("keydown", (e) => {
  if (e.key === "Enter") registerPlayer();
});

async function registerPlayer() {
  const nameInput = document.getElementById("reg-name");
  const errEl     = document.getElementById("reg-error");
  const sucEl     = document.getElementById("reg-success");
  const btn       = document.getElementById("btn-register");
  const name      = nameInput.value.trim();

  errEl.classList.add("hidden");
  sucEl.classList.add("hidden");

  if (!name) {
    showMsg(errEl, "Please enter your full name.");
    return;
  }
  if (name.length < 2) {
    showMsg(errEl, "Name must be at least 2 characters.");
    return;
  }

  // Check for duplicate name (case-insensitive)
  const duplicate = Object.values(playersData).some(
    p => p.name.toLowerCase() === name.toLowerCase()
  );
  if (duplicate) {
    showMsg(errEl, `"${name}" is already registered.`);
    return;
  }

  btn.disabled = true;
  btn.textContent = "REGISTERING...";

  try {
    const playersRef = ref(db, "players");
    const newRef     = push(playersRef);
    await set(newRef, {
      name:           name,
      goals:          0,
      matches:        0,
      goalDifference: 0,
      points:         0,
      createdAt:      Date.now()
    });

    nameInput.value = "";
    showMsg(sucEl, `✅ "${name}" registered! Welcome to the arena.`, "success", 5000);
  } catch (err) {
    showMsg(errEl, "Registration failed. Please try again.");
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.textContent = "JOIN THE ARENA";
  }
}

// =====================================================
//  REAL-TIME LEADERBOARD LISTENER
// =====================================================

const playersRef = ref(db, "players");

onValue(playersRef, (snapshot) => {
  playersData = snapshot.val() || {};
  renderLeaderboard();
  populateAdminDropdowns();
  updateLandingCount(Object.keys(playersData).length);

  // Update player count badge
  const count = Object.keys(playersData).length;
  document.getElementById("player-count-badge").textContent =
    `${count} Player${count !== 1 ? "s" : ""}`;
});

// =====================================================
//  RENDER LEADERBOARD
// =====================================================

function renderLeaderboard() {
  const body       = document.getElementById("leaderboard-body");
  const header     = document.getElementById("table-header");
  const playerList = Object.entries(playersData);

  if (playerList.length === 0) {
    body.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚽</div>
        <p>No players yet. Be the first to register!</p>
      </div>`;
    header.classList.remove("has-delete");
    return;
  }

  // Sort: Goals → Goal Difference → Points
  playerList.sort(([, a], [, b]) => {
    if (b.goals !== a.goals)          return b.goals - a.goals;
    if (b.goalDifference !== a.goalDifference)
                                      return b.goalDifference - a.goalDifference;
    return b.points - a.points;
  });

  // Toggle delete column header
  if (isAdmin) {
    header.classList.add("has-delete");
    // Add delete header if not present
    if (!header.querySelector(".th-del")) {
      const delTh = document.createElement("span");
      delTh.className = "th-del";
      delTh.style.textAlign = "center";
      delTh.textContent = "DEL";
      header.appendChild(delTh);
    }
  } else {
    header.classList.remove("has-delete");
    const delTh = header.querySelector(".th-del");
    if (delTh) delTh.remove();
  }

  body.innerHTML = "";

  playerList.forEach(([id, player], index) => {
    const rank = index + 1;
    const row  = document.createElement("div");

    row.className = `player-row${isAdmin ? " has-delete" : ""}${
      rank === 1 ? " rank-1" : rank === 2 ? " rank-2" : rank === 3 ? " rank-3" : ""
    }`;

    // Rank icon
    const rankDisplay =
      rank === 1 ? `<span class="rank-cell r1">👑</span>` :
      rank === 2 ? `<span class="rank-cell r2">🥈</span>` :
      rank === 3 ? `<span class="rank-cell r3">🥉</span>` :
                   `<span class="rank-cell rn">${rank}</span>`;

    // Points highlight
    const ptsClass = rank <= 3 ? "row-stat hi" : "row-stat";

    row.innerHTML = `
      ${rankDisplay}
      <span class="row-name">${escapeHTML(player.name)}</span>
      <span class="row-stat">${player.matches}</span>
      <span class="row-stat">${player.goals}</span>
      <span class="row-stat">${player.goalDifference > 0 ? "+" : ""}${player.goalDifference}</span>
      <span class="${ptsClass}">${player.points}</span>
      ${isAdmin ? `<button class="btn-delete" data-id="${id}" data-name="${escapeHTML(player.name)}" title="Delete player">🗑</button>` : ""}
    `;

    body.appendChild(row);
  });

  // Attach delete listeners
  if (isAdmin) {
    body.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", () => {
        pendingDeleteId   = btn.dataset.id;
        pendingDeleteName = btn.dataset.name;
        document.getElementById("confirm-name").textContent = `"${pendingDeleteName}"`;
        document.getElementById("confirm-modal").classList.remove("hidden");
      });
    });
  }
}

/** Escape HTML to prevent XSS */
function escapeHTML(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;")
            .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// =====================================================
//  DELETE PLAYER — CONFIRM MODAL
// =====================================================

document.getElementById("btn-cancel-delete").addEventListener("click", () => {
  document.getElementById("confirm-modal").classList.add("hidden");
  pendingDeleteId = null;
});

document.getElementById("btn-confirm-delete").addEventListener("click", async () => {
  if (!pendingDeleteId || !isAdmin) return;

  const btn = document.getElementById("btn-confirm-delete");
  btn.disabled    = true;
  btn.textContent = "Deleting...";

  try {
    await remove(ref(db, `players/${pendingDeleteId}`));
    logActivity(`🗑 Deleted player: <strong>${escapeHTML(pendingDeleteName)}</strong>`);
    document.getElementById("confirm-modal").classList.add("hidden");
  } catch (err) {
    alert("Failed to delete player. Check your connection.");
    console.error(err);
  } finally {
    btn.disabled    = false;
    btn.textContent = "Delete";
    pendingDeleteId = null;
  }
});

// Close confirm modal on backdrop click
document.getElementById("confirm-modal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("confirm-modal")) {
    document.getElementById("confirm-modal").classList.add("hidden");
    pendingDeleteId = null;
  }
});

// =====================================================
//  ADMIN — POPULATE DROPDOWNS
// =====================================================

function populateAdminDropdowns() {
  const selA = document.getElementById("player-a");
  const selB = document.getElementById("player-b");

  const selectedA = selA.value;
  const selectedB = selB.value;

  const sorted = Object.entries(playersData).sort(([,a],[,b]) =>
    a.name.localeCompare(b.name)
  );

  const buildOptions = (exclude) => {
    let html = `<option value="">— Select Player —</option>`;
    sorted.forEach(([id, p]) => {
      if (id !== exclude) {
        html += `<option value="${id}" ${id === selectedA || id === selectedB ? "" : ""}>
          ${escapeHTML(p.name)}
        </option>`;
      }
    });
    return html;
  };

  selA.innerHTML = buildOptions(selectedB);
  selB.innerHTML = buildOptions(selectedA);

  // Restore previous selections if still valid
  if (selectedA && playersData[selectedA]) selA.value = selectedA;
  if (selectedB && playersData[selectedB]) selB.value = selectedB;

  // Keep dropdowns mutually exclusive
  selA.onchange = () => { selB.innerHTML = buildOptions(selA.value); };
  selB.onchange = () => { selA.innerHTML = buildOptions(selB.value); };
}

// =====================================================
//  ADMIN — SUBMIT MATCH RESULT
// =====================================================

document.getElementById("btn-submit-match").addEventListener("click", submitMatchResult);

async function submitMatchResult() {
  if (!isAdmin) return;

  const idA    = document.getElementById("player-a").value;
  const idB    = document.getElementById("player-b").value;
  const goalsA = parseInt(document.getElementById("goals-a").value, 10);
  const goalsB = parseInt(document.getElementById("goals-b").value, 10);
  const errEl  = document.getElementById("match-error");
  const sucEl  = document.getElementById("match-success");
  const btn    = document.getElementById("btn-submit-match");

  errEl.classList.add("hidden");
  sucEl.classList.add("hidden");

  // Validation
  if (!idA || !idB)                { showMsg(errEl, "Select both players."); return; }
  if (idA === idB)                  { showMsg(errEl, "Players must be different."); return; }
  if (isNaN(goalsA) || goalsA < 0) { showMsg(errEl, "Invalid goals for Player A."); return; }
  if (isNaN(goalsB) || goalsB < 0) { showMsg(errEl, "Invalid goals for Player B."); return; }

  const pA = playersData[idA];
  const pB = playersData[idB];
  if (!pA || !pB) { showMsg(errEl, "Player data not found. Refresh and try again."); return; }

  btn.disabled    = true;
  btn.textContent = "SAVING...";

  // Calculate new stats
  const aWon  = goalsA > goalsB;
  const bWon  = goalsB > goalsA;
  const draw  = goalsA === goalsB;

  const updA = {
    goals:          pA.goals + goalsA,
    matches:        pA.matches + 1,
    goalDifference: pA.goalDifference + (goalsA - goalsB),
    points:         pA.points + (aWon ? 3 : draw ? 1 : 0)
  };
  const updB = {
    goals:          pB.goals + goalsB,
    matches:        pB.matches + 1,
    goalDifference: pB.goalDifference + (goalsB - goalsA),
    points:         pB.points + (bWon ? 3 : draw ? 1 : 0)
  };

  try {
    await update(ref(db, `players/${idA}`), updA);
    await update(ref(db, `players/${idB}`), updB);

    // Result string for log
    const result = aWon
      ? `<strong>${escapeHTML(pA.name)}</strong> won`
      : bWon
      ? `<strong>${escapeHTML(pB.name)}</strong> won`
      : "Draw";

    logActivity(`
      ⚽ Match: <strong>${escapeHTML(pA.name)}</strong> ${goalsA} – ${goalsB}
      <strong>${escapeHTML(pB.name)}</strong> — ${result}
    `);

    showMsg(sucEl,
      `✅ Match saved! ${pA.name} ${goalsA}–${goalsB} ${pB.name}`,
      "success", 5000
    );

    // Reset score inputs
    document.getElementById("goals-a").value = "0";
    document.getElementById("goals-b").value = "0";

  } catch (err) {
    showMsg(errEl, "Failed to save match. Check your connection.");
    console.error(err);
  } finally {
    btn.disabled    = false;
    btn.textContent = "SUBMIT RESULT";
  }
}

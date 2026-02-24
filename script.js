/* ═══════════════════════════════════════════════════════════════
   O BLOCK E FOOTBALL — script.js v2.0
   Features: Leaderboard, Player Profiles, Fixtures, Brackets, WhatsApp
   ═══════════════════════════════════════════════════════════════ */
"use strict";

/* ── FIREBASE CONFIG ── */
const firebaseConfig = {
  apiKey:            "AIzaSyA1-bJJCTtX1hPHY6Ibln_8rH29a0ioyb8",
  authDomain:        "o-block-e-football.firebaseapp.com",
  databaseURL:       "https://o-block-e-football-default-rtdb.firebaseio.com",
  projectId:         "o-block-e-football",
  storageBucket:     "o-block-e-football.firebasestorage.app",
  messagingSenderId: "1068493512938",
  appId:             "1:1068493512938:web:65e8923a3289cb26f67793",
  measurementId:     "G-G7J8TRHB86"
};

const ADMIN_UID = "2gpO7N71hyTZygagaXqZh6xXKaS2";
const SITE_URL  = "https://o-block-e-football.netlify.app";

/* ── INIT FIREBASE ── */
firebase.initializeApp(firebaseConfig);
const auth        = firebase.auth();
const db          = firebase.database();
const playersRef  = db.ref("players");
const fixturesRef = db.ref("fixtures");
const bracketRef  = db.ref("bracket");

/* ── DOM REFS ── */
const $ = id => document.getElementById(id);

const landingPage         = $("landing-page");
const mainApp             = $("main-app");
const enterArenaBtn       = $("enterArenaBtn");
const authArea            = $("auth-area");
const loginCard           = $("login-card");
const doLoginBtn          = $("doLoginBtn");
const loginMsg            = $("login-msg");
const playerNameInput     = $("playerNameInput");
const playerPhotoInput    = $("playerPhotoInput");
const playerPositionInput = $("playerPositionInput");
const registerBtn         = $("registerBtn");
const registerMsg         = $("register-msg");
const adminPanel          = $("admin-panel");
const playerA             = $("playerA");
const playerB             = $("playerB");
const goalsA              = $("goalsA");
const goalsB              = $("goalsB");
const submitMatchBtn      = $("submitMatchBtn");
const matchMsg            = $("match-msg");
const leaderboardBody     = $("leaderboard-body");
const deleteColHeader     = $("delete-col-header");
const fixtureAdminPanel   = $("fixture-admin-panel");
const fixturePlayerA      = $("fixturePlayerA");
const fixturePlayerB      = $("fixturePlayerB");
const fixtureDate         = $("fixtureDate");
const fixtureVenue        = $("fixtureVenue");
const addFixtureBtn       = $("addFixtureBtn");
const fixtureMsg          = $("fixture-msg");
const fixturesList        = $("fixtures-list");
const playersGrid         = $("players-grid");
const bracketAdminPanel   = $("bracket-admin-panel");
const tournamentName      = $("tournamentName");
const bracketType         = $("bracketType");
const generateBracketBtn  = $("generateBracketBtn");
const clearBracketBtn     = $("clearBracketBtn");
const bracketMsg          = $("bracket-msg");
const bracketContainer    = $("bracket-container");
const bracketTitle        = $("bracket-title");
const confirmModal        = $("confirmModal");
const modalText           = $("modalText");
const cancelDeleteBtn     = $("cancelDeleteBtn");
const confirmDeleteBtn    = $("confirmDeleteBtn");
const profileModal        = $("profileModal");
const closeProfileBtn     = $("closeProfileBtn");
const toast               = $("toast");
const toastMsg            = $("toast-msg");

/* ── STATE ── */
let currentUser    = null;
let isAdmin        = false;
let playerToDelete = null;
let playersCache   = {};
let toastTimer     = null;
let activeTab      = "leaderboard";

/* ══════════════════════════════════════
   LANDING + PARTICLES
   ══════════════════════════════════════ */
function spawnParticles() {
  const container = $("particles");
  if (!container) return;
  for (let i = 0; i < 40; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.style.left              = Math.random() * 100 + "vw";
    p.style.bottom            = "-10px";
    p.style.width             = (Math.random() * 3 + 1) + "px";
    p.style.height            = p.style.width;
    p.style.animationDuration = (Math.random() * 10 + 8) + "s";
    p.style.animationDelay    = (Math.random() * 10) + "s";
    container.appendChild(p);
  }
}
spawnParticles();

enterArenaBtn.addEventListener("click", () => {
  landingPage.classList.add("slide-out");
  setTimeout(() => {
    landingPage.classList.add("hidden");
    mainApp.classList.remove("hidden");
  }, 800);
});

/* ══════════════════════════════════════
   TAB NAVIGATION
   ══════════════════════════════════════ */
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    activeTab = btn.dataset.tab;
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.add("hidden"));
    btn.classList.add("active");
    $("tab-" + activeTab).classList.remove("hidden");

    // Show/hide admin panels based on tab
    if (isAdmin) {
      fixtureAdminPanel.classList.toggle("hidden", activeTab !== "fixtures");
      bracketAdminPanel.classList.toggle("hidden", activeTab !== "bracket");
      adminPanel.classList.toggle("hidden", activeTab !== "leaderboard");
    }
  });
});

/* ══════════════════════════════════════
   AUTH
   ══════════════════════════════════════ */
auth.onAuthStateChanged(user => {
  currentUser = user;
  isAdmin = user && user.uid === ADMIN_UID;
  updateUI();
});

function updateUI() {
  authArea.innerHTML = "";
  if (currentUser && isAdmin) {
    const wrap = document.createElement("div");
    wrap.style.cssText = "display:flex;align-items:center;gap:12px;";
    wrap.innerHTML = `
      <span style="font-family:var(--font-main);font-size:0.7rem;color:var(--neon);letter-spacing:0.08em;">🔐 ADMIN</span>
      <button class="btn-ghost" id="logoutBtn">LOGOUT</button>`;
    authArea.appendChild(wrap);
    $("logoutBtn").addEventListener("click", () => auth.signOut());
  } else {
    const btn = document.createElement("button");
    btn.className = "btn-ghost";
    btn.textContent = "ADMIN LOGIN";
    btn.addEventListener("click", () => loginCard.classList.toggle("hidden"));
    authArea.appendChild(btn);
  }

  // Admin panels
  adminPanel.classList.toggle("hidden", !(isAdmin && activeTab === "leaderboard"));
  fixtureAdminPanel.classList.toggle("hidden", !(isAdmin && activeTab === "fixtures"));
  bracketAdminPanel.classList.toggle("hidden", !(isAdmin && activeTab === "bracket"));
  loginCard.classList.toggle("hidden", currentUser !== null);
  deleteColHeader.classList.toggle("hidden", !isAdmin);
  document.querySelectorAll(".delete-btn").forEach(b => b.classList.toggle("hidden", !isAdmin));
  document.querySelectorAll(".fixture-delete").forEach(b => b.classList.toggle("hidden", !isAdmin));

  if (currentUser && isAdmin) showToast("✅ Logged in as Admin", "success");
}

/* ── GOOGLE LOGIN ── */
doLoginBtn.addEventListener("click", async () => {
  doLoginBtn.disabled = true;
  doLoginBtn.querySelector("span").textContent = "SIGNING IN...";
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await auth.signInWithPopup(provider);
    if (result.user.uid !== ADMIN_UID) {
      await auth.signOut();
      showMsg(loginMsg, "⛔ Access denied. Not authorized as admin.", "error");
    } else {
      loginCard.classList.add("hidden");
      clearMsg(loginMsg);
    }
  } catch (err) {
    const msgs = { "auth/popup-closed-by-user": "Sign-in cancelled.", "auth/popup-blocked": "Popup blocked — allow popups for this site." };
    showMsg(loginMsg, msgs[err.code] || "Sign-in failed: " + err.message, "error");
  }
  doLoginBtn.disabled = false;
  doLoginBtn.querySelector("span").textContent = "SIGN IN WITH GOOGLE";
});

/* ══════════════════════════════════════
   PLAYER REGISTRATION
   ══════════════════════════════════════ */
registerBtn.addEventListener("click", async () => {
  const name     = playerNameInput.value.trim();
  const photo    = playerPhotoInput.value.trim();
  const position = playerPositionInput.value.trim();

  if (!name || name.length < 2) { showMsg(registerMsg, "Please enter a valid full name.", "error"); return; }

  const duplicate = Object.values(playersCache).some(p => p.name.toLowerCase() === name.toLowerCase());
  if (duplicate) { showMsg(registerMsg, "A player with this name already exists.", "error"); return; }

  registerBtn.disabled = true;
  registerBtn.querySelector("span").textContent = "REGISTERING...";
  try {
    await playersRef.push({
      name, photo: photo || "", position: position || "Player",
      goals: 0, matches: 0, goalDifference: 0, points: 0, wins: 0, draws: 0, losses: 0,
      createdAt: firebase.database.ServerValue.TIMESTAMP
    });
    playerNameInput.value = "";
    playerPhotoInput.value = "";
    playerPositionInput.value = "";
    clearMsg(registerMsg);
    showToast(`🎮 ${name} has entered the arena!`, "success");
  } catch (err) {
    showMsg(registerMsg, "Failed to register: " + err.message, "error");
  }
  registerBtn.disabled = false;
  registerBtn.querySelector("span").textContent = "REGISTER PLAYER";
});

playerNameInput.addEventListener("keydown", e => { if (e.key === "Enter") registerBtn.click(); });

/* ══════════════════════════════════════
   REAL-TIME LEADERBOARD
   ══════════════════════════════════════ */
playersRef.on("value", snapshot => {
  const data = snapshot.val();
  playersCache = data || {};

  if (!data) {
    leaderboardBody.innerHTML = `<tr><td colspan="7" class="empty-state">⚽ No players yet. Register to start competing!</td></tr>`;
    renderPlayersGrid({});
    populateAllDropdowns({});
    return;
  }

  const players = Object.entries(data).map(([id, p]) => ({ id, ...p }));
  players.sort((a, b) => {
    if (b.goals !== a.goals) return b.goals - a.goals;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.points - a.points;
  });

  renderLeaderboard(players);
  renderPlayersGrid(data);
  populateAllDropdowns(data);
});

function renderLeaderboard(players) {
  leaderboardBody.innerHTML = "";
  players.forEach((player, index) => {
    const rank      = index + 1;
    const rowClass  = rank === 1 ? "row-gold" : rank === 2 ? "row-silver" : rank === 3 ? "row-bronze" : "";
    const rankIcon  = rank === 1 ? "👑" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank;
    const rankClass = rank === 1 ? "rank-1" : rank === 2 ? "rank-2" : rank === 3 ? "rank-3" : "";
    const initials  = player.name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
    const avatarContent = player.photo
      ? `<img src="${escapeHtml(player.photo)}" alt="${escapeHtml(player.name)}" onerror="this.parentElement.textContent='${initials}'">`
      : initials;
    const gdStr = player.goalDifference >= 0 ? "+" + player.goalDifference : player.goalDifference;

    const tr = document.createElement("tr");
    tr.className = rowClass;
    tr.setAttribute("data-id", player.id);
    tr.innerHTML = `
      <td class="rank-cell ${rankClass}">${rankIcon}</td>
      <td>
        <div class="player-name-cell" data-id="${player.id}">
          <div class="player-avatar">${avatarContent}</div>
          ${escapeHtml(player.name)}
        </div>
      </td>
      <td>${player.matches}</td>
      <td>${player.goals}</td>
      <td>${gdStr}</td>
      <td class="pts-cell">${player.points}</td>
      <td><button class="delete-btn ${isAdmin ? "" : "hidden"}" data-id="${player.id}" data-name="${escapeHtml(player.name)}">DEL</button></td>`;
    leaderboardBody.appendChild(tr);
  });

  // Click player name → open profile
  document.querySelectorAll(".player-name-cell").forEach(cell => {
    cell.addEventListener("click", () => openProfile(cell.dataset.id, players));
  });

  // Delete buttons
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      playerToDelete = { id: btn.dataset.id, name: btn.dataset.name };
      modalText.textContent = `Delete "${playerToDelete.name}" from the leaderboard? This cannot be undone.`;
      confirmModal.classList.remove("hidden");
    });
  });
}

/* ══════════════════════════════════════
   PLAYER PROFILES GRID
   ══════════════════════════════════════ */
function renderPlayersGrid(data) {
  if (!Object.keys(data).length) {
    playersGrid.innerHTML = `<div class="empty-state">👤 No players registered yet.</div>`;
    return;
  }
  const players = Object.entries(data).map(([id, p]) => ({ id, ...p }));
  players.sort((a, b) => b.points - a.points);

  playersGrid.innerHTML = "";
  players.forEach((player, index) => {
    const initials = player.name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
    const avatarContent = player.photo
      ? `<img src="${escapeHtml(player.photo)}" alt="${escapeHtml(player.name)}" onerror="this.parentElement.textContent='${initials}'">`
      : initials;

    const card = document.createElement("div");
    card.className = "player-profile-card";
    card.innerHTML = `
      <div class="profile-card-avatar">${avatarContent}</div>
      <div class="profile-card-name">${escapeHtml(player.name)}</div>
      <div class="profile-card-pos">${escapeHtml(player.position || "Player")}</div>
      <div class="profile-card-pts">${player.points}</div>
      <div class="profile-card-pts-label">POINTS</div>`;
    card.addEventListener("click", () => openProfile(player.id, players));
    playersGrid.appendChild(card);
  });
}

/* ── OPEN PLAYER PROFILE MODAL ── */
function openProfile(playerId, playersList) {
  const player = playersList.find(p => p.id === playerId);
  if (!player) return;

  const sorted = [...playersList].sort((a, b) => {
    if (b.goals !== a.goals) return b.goals - a.goals;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.points - a.points;
  });
  const rank    = sorted.findIndex(p => p.id === playerId) + 1;
  const winRate = player.matches > 0 ? Math.round((player.wins || 0) / player.matches * 100) : 0;
  const initials = player.name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();

  const avatarEl = $("profileAvatar");
  if (player.photo) {
    avatarEl.innerHTML = `<img src="${escapeHtml(player.photo)}" alt="${escapeHtml(player.name)}" onerror="this.parentElement.textContent='${initials}'">`;
  } else {
    avatarEl.textContent = initials;
  }

  $("profileName").textContent     = player.name;
  $("profilePosition").textContent = player.position || "Player";
  $("profileMatches").textContent  = player.matches;
  $("profileGoals").textContent    = player.goals;
  $("profileGD").textContent       = (player.goalDifference >= 0 ? "+" : "") + player.goalDifference;
  $("profilePoints").textContent   = player.points;
  $("profileWinRate").textContent  = winRate + "%";
  $("profileRank").textContent     = "#" + rank;

  $("shareProfileBtn").onclick = () => shareOnWhatsApp(
    `⚽ *O BLOCK E FOOTBALL*\n\n👤 *${player.name}*\n🏅 Position: ${player.position || "Player"}\n📊 Stats:\n• Matches: ${player.matches}\n• Goals: ${player.goals}\n• Points: ${player.points}\n• Rank: #${rank}\n\n🌐 ${SITE_URL}`
  );

  profileModal.classList.remove("hidden");
}

closeProfileBtn.addEventListener("click", () => profileModal.classList.add("hidden"));
profileModal.addEventListener("click", e => { if (e.target === profileModal) profileModal.classList.add("hidden"); });

/* ══════════════════════════════════════
   MATCH UPDATE
   ══════════════════════════════════════ */
submitMatchBtn.addEventListener("click", async () => {
  if (!isAdmin) { showToast("⛔ Admin access required.", "error"); return; }
  const idA = playerA.value, idB = playerB.value;
  const gA  = parseInt(goalsA.value) || 0;
  const gB  = parseInt(goalsB.value) || 0;

  if (!idA || !idB) { showMsg(matchMsg, "Please select both players.", "error"); return; }
  if (idA === idB)  { showMsg(matchMsg, "Player A and B must be different.", "error"); return; }

  submitMatchBtn.disabled = true;
  submitMatchBtn.querySelector("span").textContent = "⚡ UPDATING...";

  try {
    const [snapA, snapB] = await Promise.all([db.ref(`players/${idA}`).get(), db.ref(`players/${idB}`).get()]);
    const pA = snapA.val(), pB = snapB.val();
    let ptsA = 0, ptsB = 0, winsA = 0, winsB = 0, drawsA = 0, drawsB = 0, lossA = 0, lossB = 0;

    if (gA > gB)      { ptsA = 3; winsA = 1; lossB = 1; }
    else if (gB > gA) { ptsB = 3; winsB = 1; lossA = 1; }
    else              { ptsA = 1; ptsB = 1; drawsA = 1; drawsB = 1; }

    const updates = {
      [`players/${idA}/matches`]:        (pA.matches || 0) + 1,
      [`players/${idA}/goals`]:          (pA.goals || 0) + gA,
      [`players/${idA}/goalDifference`]: (pA.goalDifference || 0) + (gA - gB),
      [`players/${idA}/points`]:         (pA.points || 0) + ptsA,
      [`players/${idA}/wins`]:           (pA.wins || 0) + winsA,
      [`players/${idA}/draws`]:          (pA.draws || 0) + drawsA,
      [`players/${idA}/losses`]:         (pA.losses || 0) + lossA,
      [`players/${idB}/matches`]:        (pB.matches || 0) + 1,
      [`players/${idB}/goals`]:          (pB.goals || 0) + gB,
      [`players/${idB}/goalDifference`]: (pB.goalDifference || 0) + (gB - gA),
      [`players/${idB}/points`]:         (pB.points || 0) + ptsB,
      [`players/${idB}/wins`]:           (pB.wins || 0) + winsB,
      [`players/${idB}/draws`]:          (pB.draws || 0) + drawsB,
      [`players/${idB}/losses`]:         (pB.losses || 0) + lossB,
    };
    await db.ref().update(updates);

    playerA.value = ""; playerB.value = ""; goalsA.value = "0"; goalsB.value = "0";
    clearMsg(matchMsg);
    const result = gA > gB ? `${pA.name} wins ${gA}–${gB}` : gB > gA ? `${pB.name} wins ${gB}–${gA}` : `Draw ${gA}–${gB}`;
    showToast(`✅ ${result}`, "success");

    // Auto-update fixture status if this match was scheduled
    markFixtureCompleted(idA, idB);
  } catch (err) {
    showMsg(matchMsg, "Failed: " + err.message, "error");
  }
  submitMatchBtn.disabled = false;
  submitMatchBtn.querySelector("span").textContent = "⚡ UPDATE MATCH RESULT";
});

/* ══════════════════════════════════════
   FIXTURES
   ══════════════════════════════════════ */
addFixtureBtn.addEventListener("click", async () => {
  if (!isAdmin) return;
  const pA  = fixturePlayerA.value;
  const pB  = fixturePlayerB.value;
  const dt  = fixtureDate.value;
  const ven = fixtureVenue.value.trim();

  if (!pA || !pB) { showMsg(fixtureMsg, "Please select both players.", "error"); return; }
  if (pA === pB)  { showMsg(fixtureMsg, "Players must be different.", "error"); return; }
  if (!dt)        { showMsg(fixtureMsg, "Please select a date and time.", "error"); return; }

  addFixtureBtn.disabled = true;
  try {
    const pAName = playersCache[pA]?.name || "Player A";
    const pBName = playersCache[pB]?.name || "Player B";
    await fixturesRef.push({
      playerAId: pA, playerAName: pAName,
      playerBId: pB, playerBName: pBName,
      date: dt, venue: ven || "",
      status: "upcoming",
      createdAt: firebase.database.ServerValue.TIMESTAMP
    });
    fixturePlayerA.value = ""; fixturePlayerB.value = ""; fixtureDate.value = ""; fixtureVenue.value = "";
    clearMsg(fixtureMsg);
    showToast(`📅 ${pAName} vs ${pBName} scheduled!`, "success");
  } catch (err) {
    showMsg(fixtureMsg, "Failed: " + err.message, "error");
  }
  addFixtureBtn.disabled = false;
});

/* Real-time fixtures listener */
fixturesRef.on("value", snapshot => {
  const data = snapshot.val();
  if (!data) {
    fixturesList.innerHTML = `<div class="empty-state">📅 No fixtures scheduled yet.<br>Admin can schedule matches from the left panel.</div>`;
    return;
  }

  const fixtures = Object.entries(data).map(([id, f]) => ({ id, ...f }));
  fixtures.sort((a, b) => new Date(a.date) - new Date(b.date));

  fixturesList.innerHTML = "";
  fixtures.forEach(fix => {
    const dateObj    = new Date(fix.date);
    const dateStr    = dateObj.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
    const timeStr    = dateObj.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const statusCls  = fix.status === "completed" ? "status-completed" : "status-upcoming";
    const statusTxt  = fix.status === "completed" ? "✅ DONE" : "⏳ UPCOMING";

    const div = document.createElement("div");
    div.className = "fixture-card";
    div.innerHTML = `
      <div class="fixture-teams">
        <span class="fixture-team">${escapeHtml(fix.playerAName)}</span>
        <span class="fixture-vs">VS</span>
        <span class="fixture-team right">${escapeHtml(fix.playerBName)}</span>
      </div>
      <div class="fixture-meta">
        <span class="fixture-time">📅 ${dateStr} • ${timeStr}</span>
        ${fix.venue ? `<span class="fixture-venue">📍 ${escapeHtml(fix.venue)}</span>` : ""}
        <span class="fixture-status ${statusCls}">${statusTxt}</span>
        <button class="fixture-delete ${isAdmin ? "" : "hidden"}" data-id="${fix.id}" title="Delete fixture">🗑️</button>
      </div>`;
    fixturesList.appendChild(div);
  });

  // Delete fixture buttons
  document.querySelectorAll(".fixture-delete").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!isAdmin) return;
      await db.ref(`fixtures/${btn.dataset.id}`).remove();
      showToast("Fixture removed.", "success");
    });
  });
});

async function markFixtureCompleted(idA, idB) {
  try {
    const snap = await fixturesRef.once("value");
    if (!snap.val()) return;
    Object.entries(snap.val()).forEach(async ([key, fix]) => {
      if (fix.status === "upcoming" &&
          ((fix.playerAId === idA && fix.playerBId === idB) ||
           (fix.playerAId === idB && fix.playerBId === idA))) {
        await db.ref(`fixtures/${key}/status`).set("completed");
      }
    });
  } catch (e) { /* silent */ }
}

/* ══════════════════════════════════════
   DROPDOWN POPULATION
   ══════════════════════════════════════ */
function populateAllDropdowns(data) {
  const players = Object.entries(data).map(([id, p]) => ({ id, name: p.name }));
  players.sort((a, b) => a.name.localeCompare(b.name));

  const buildOpts = (excludeId = "") => {
    let html = `<option value="">Select Player...</option>`;
    players.forEach(p => {
      if (p.id !== excludeId) html += `<option value="${p.id}">${escapeHtml(p.name)}</option>`;
    });
    return html;
  };

  playerA.innerHTML        = buildOpts(playerB.value);
  playerB.innerHTML        = buildOpts(playerA.value);
  fixturePlayerA.innerHTML = buildOpts(fixturePlayerB.value);
  fixturePlayerB.innerHTML = buildOpts(fixturePlayerA.value);

  playerA.onchange = () => { playerB.innerHTML = buildOpts(playerA.value); };
  playerB.onchange = () => { playerA.innerHTML = buildOpts(playerB.value); };
  fixturePlayerA.onchange = () => { fixturePlayerB.innerHTML = buildOpts(fixturePlayerA.value); };
  fixturePlayerB.onchange = () => { fixturePlayerA.innerHTML = buildOpts(fixturePlayerB.value); };
}

/* ══════════════════════════════════════
   TOURNAMENT BRACKET
   ══════════════════════════════════════ */
generateBracketBtn.addEventListener("click", async () => {
  if (!isAdmin) return;
  const name = tournamentName.value.trim() || "O BLOCK TOURNAMENT";
  const type = bracketType.value;
  const players = Object.entries(playersCache).map(([id, p]) => ({ id, name: p.name }));

  if (players.length < 2) { showMsg(bracketMsg, "Need at least 2 players to generate a bracket.", "error"); return; }

  // Shuffle players
  for (let i = players.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [players[i], players[j]] = [players[j], players[i]];
  }

  generateBracketBtn.disabled = true;
  try {
    await bracketRef.set({ name, type, players, createdAt: firebase.database.ServerValue.TIMESTAMP });
    clearMsg(bracketMsg);
    showToast(`🎯 ${name} bracket generated!`, "success");
  } catch (err) {
    showMsg(bracketMsg, "Failed: " + err.message, "error");
  }
  generateBracketBtn.disabled = false;
});

clearBracketBtn.addEventListener("click", async () => {
  if (!isAdmin) return;
  await bracketRef.remove();
  showToast("Bracket cleared.", "success");
});

/* Real-time bracket listener */
bracketRef.on("value", snapshot => {
  const data = snapshot.val();
  if (!data) {
    bracketContainer.innerHTML = `<div class="empty-state">🎯 No tournament generated yet.<br>Admin can create one from the left panel.</div>`;
    bracketTitle.textContent = "TOURNAMENT BRACKET";
    return;
  }
  bracketTitle.textContent = data.name.toUpperCase();
  if (data.type === "elimination") renderEliminationBracket(data.players);
  else renderRoundRobinBracket(data.players);
});

function renderEliminationBracket(players) {
  let rounds = [];
  let current = [...players];

  // Pad to power of 2
  while (current.length & (current.length - 1)) {
    current.push({ id: "bye", name: "BYE" });
  }

  while (current.length >= 2) {
    const round = [];
    for (let i = 0; i < current.length; i += 2) {
      round.push([current[i], current[i + 1]]);
    }
    rounds.push(round);
    current = round.map(() => ({ id: "tbd", name: "TBD" }));
  }

  const roundNames = ["ROUND OF " + players.length, "QUARTER FINALS", "SEMI FINALS", "FINAL", "CHAMPION"];

  let html = `<div class="bracket-type-badge">SINGLE ELIMINATION</div><div class="elimination-bracket">`;
  rounds.forEach((round, ri) => {
    const label = roundNames[Math.min(ri, roundNames.length - 1)];
    html += `<div class="bracket-round"><div class="round-label">${label}</div>`;
    round.forEach(match => {
      const p1cls = match[0].id === "bye" ? "tbd" : "";
      const p2cls = match[1].id === "bye" ? "tbd" : "";
      html += `<div class="bracket-match">
        <div class="bracket-player ${p1cls}">${escapeHtml(match[0].name)}</div>
        <div class="bracket-player ${p2cls}">${escapeHtml(match[1].name)}</div>
      </div>`;
    });
    html += `</div>`;
  });
  html += `</div>`;
  bracketContainer.innerHTML = html;
}

function renderRoundRobinBracket(players) {
  const matches = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      matches.push({ p1: players[i], p2: players[j] });
    }
  }

  let html = `<div class="bracket-type-badge">ROUND ROBIN</div>
    <p style="color:var(--text-dim);font-size:0.85rem;padding:12px 0 16px;">
      Total matches: <strong style="color:var(--neon)">${matches.length}</strong> — Every player faces each other once.
    </p>
    <table class="roundrobin-table">
      <thead><tr><th>#</th><th>MATCH</th><th>STATUS</th></tr></thead><tbody>`;

  matches.forEach((m, i) => {
    // Check if this match has been played (look in leaderboard data)
    const p1 = playersCache[m.p1.id];
    const p2 = playersCache[m.p2.id];
    const played = p1 && p2 && (p1.matches > 0 || p2.matches > 0);
    html += `<tr>
      <td style="color:var(--text-dim);font-size:0.8rem">${i + 1}</td>
      <td style="font-weight:600">${escapeHtml(m.p1.name)} <span style="color:var(--neon)">vs</span> ${escapeHtml(m.p2.name)}</td>
      <td><span class="match-result ${played ? "result-done" : "result-pending"}">${played ? "✅ Played" : "⏳ Pending"}</span></td>
    </tr>`;
  });

  html += `</tbody></table>`;
  bracketContainer.innerHTML = html;
}

/* ══════════════════════════════════════
   DELETE PLAYER
   ══════════════════════════════════════ */
cancelDeleteBtn.addEventListener("click", () => { confirmModal.classList.add("hidden"); playerToDelete = null; });
confirmModal.addEventListener("click", e => { if (e.target === confirmModal) { confirmModal.classList.add("hidden"); playerToDelete = null; } });

confirmDeleteBtn.addEventListener("click", async () => {
  if (!playerToDelete || !isAdmin) return;
  confirmDeleteBtn.disabled = true;
  confirmDeleteBtn.textContent = "DELETING...";
  try {
    await db.ref(`players/${playerToDelete.id}`).remove();
    showToast(`🗑️ ${playerToDelete.name} removed.`, "success");
  } catch (err) {
    showToast("Failed: " + err.message, "error");
  }
  confirmModal.classList.add("hidden");
  playerToDelete = null;
  confirmDeleteBtn.disabled = false;
  confirmDeleteBtn.textContent = "DELETE";
});

/* ══════════════════════════════════════
   WHATSAPP SHARING
   ══════════════════════════════════════ */
function shareOnWhatsApp(text) {
  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encoded}`, "_blank");
}

function buildLeaderboardText() {
  const players = Object.entries(playersCache).map(([id, p]) => ({ id, ...p }));
  players.sort((a, b) => {
    if (b.goals !== a.goals) return b.goals - a.goals;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.points - a.points;
  });
  let text = `🏆 *O BLOCK E FOOTBALL — LIVE LEADERBOARD*\n\n`;
  players.slice(0, 10).forEach((p, i) => {
    const medal = i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
    text += `${medal} *${p.name}* — ${p.points} pts (${p.goals} goals)\n`;
  });
  text += `\n🌐 ${SITE_URL}`;
  return text;
}

$("shareLeaderboardBtn").addEventListener("click", () => shareOnWhatsApp(buildLeaderboardText()));
$("shareFixturesBtn").addEventListener("click", () => {
  let text = `📅 *O BLOCK E FOOTBALL — FIXTURES*\n\n`;
  const fixtures = document.querySelectorAll(".fixture-card");
  if (!fixtures.length) { showToast("No fixtures to share.", "error"); return; }
  fixtures.forEach(f => {
    const teams = f.querySelector(".fixture-teams");
    const meta  = f.querySelector(".fixture-time");
    if (teams && meta) text += `⚽ ${teams.innerText.replace(/\n/g," ")}\n📅 ${meta.textContent}\n\n`;
  });
  text += `🌐 ${SITE_URL}`;
  shareOnWhatsApp(text);
});
$("shareBracketBtn").addEventListener("click", () => {
  shareOnWhatsApp(`🎯 *O BLOCK E FOOTBALL — TOURNAMENT BRACKET*\n\nCheck out the full bracket and standings!\n\n🌐 ${SITE_URL}`);
});

/* ══════════════════════════════════════
   UTILITIES
   ══════════════════════════════════════ */
function showMsg(el, text, type) { el.textContent = text; el.className = `msg-box ${type}`; el.classList.remove("hidden"); }
function clearMsg(el) { el.classList.add("hidden"); el.textContent = ""; }
function showToast(message, type = "success") {
  if (toastTimer) clearTimeout(toastTimer);
  toastMsg.textContent = message;
  toast.className = `toast toast-${type}`;
  toast.classList.remove("hidden");
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 4000);
}
function escapeHtml(text) {
  return String(text).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

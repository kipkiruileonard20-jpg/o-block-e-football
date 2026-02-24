/* ═══════════════════════════════════════════════════════════
   O BLOCK E FOOTBALL — script.js
   PRODUCTION — Firebase Live
═══════════════════════════════════════════════════════════ */

'use strict';

const firebaseConfig = {
  apiKey:            "AIzaSyA1-bJJCTtX1hPHY6Ibln_8rH29a0ioyb8",
  authDomain:        "o-block-e-football.firebaseapp.com",
  databaseURL:       "https://o-block-e-football-default-rtdb.firebaseio.com",
  projectId:         "o-block-e-football",
  storageBucket:     "o-block-e-football.firebasestorage.app",
  messagingSenderId: "1068493512938",
  appId:             "1:1068493512938:web:65e8923a3289cb26f67793"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.database();

const ADMIN_UIDS = ["2gpO7N71hyTZygagaXqZh6xXKaS2"];

let currentUser  = null;
let isAdmin      = false;
let playersCache = {};
let deleteTarget = null;
let toastTimer   = null;

const $ = id => document.getElementById(id);
const DOM = {
  landing:$('landing'),app:$('app'),enterBtn:$('enterBtn'),
  navUser:$('navUser'),navUserEmail:$('navUserEmail'),navAdminLink:$('navAdminLink'),
  loginNavBtn:$('loginNavBtn'),logoutBtn:$('logoutBtn'),hamburger:$('hamburger'),
  mobileMenu:$('mobileMenu'),mobLoginBtn:$('mobLoginBtn'),mobLogoutBtn:$('mobLogoutBtn'),
  mobAdminLink:$('mobAdminLink'),hsPlayers:$('hs-players'),hsGoals:$('hs-goals'),
  hsMatches:$('hs-matches'),registerForm:$('registerForm'),regName:$('regName'),
  regBtn:$('regBtn'),regMsg:$('regMsg'),leaderboardBody:$('leaderboardBody'),
  loginModal:$('loginModal'),closeLoginModal:$('closeLoginModal'),loginForm:$('loginForm'),
  loginEmail:$('loginEmail'),loginPass:$('loginPass'),loginBtn:$('loginBtn'),
  loginMsg:$('loginMsg'),deleteModal:$('deleteModal'),deleteModalMsg:$('deleteModalMsg'),
  deleteCancelBtn:$('deleteCancelBtn'),deleteConfirmBtn:$('deleteConfirmBtn'),
  adminSection:$('section-admin'),matchForm:$('matchForm'),matchPlayerA:$('matchPlayerA'),
  matchPlayerB:$('matchPlayerB'),matchGoalsA:$('matchGoalsA'),matchGoalsB:$('matchGoalsB'),
  matchBtn:$('matchBtn'),matchMsg:$('matchMsg'),adminPlayerList:$('adminPlayerList'),
  toast:$('toast'),bgCanvas:$('bgCanvas'),
};

/* PARTICLES */
(function(){
  const c=DOM.bgCanvas,ctx=c.getContext('2d');let W,H,pts=[];
  function resize(){W=c.width=innerWidth;H=c.height=innerHeight;}
  resize();addEventListener('resize',resize);
  class P{
    constructor(){this.reset(true);}
    reset(i=false){
      this.x=Math.random()*W;this.y=i?Math.random()*H:H+5;
      this.vx=(Math.random()-.5)*.35;this.vy=-(Math.random()*.5+.08);
      this.life=i?Math.random():1;this.dec=Math.random()*.004+.001;
      this.size=Math.random()*1.8+.3;this.col=Math.random()>.58?'0,247,255':'255,45,85';
    }
    update(){this.x+=this.vx;this.y+=this.vy;this.life-=this.dec;if(this.life<=0)this.reset();}
    draw(){ctx.beginPath();ctx.arc(this.x,this.y,this.size,0,Math.PI*2);ctx.fillStyle=`rgba(${this.col},${(this.life*.65).toFixed(2)})`;ctx.fill();}
  }
  for(let i=0;i<140;i++)pts.push(new P());
  (function loop(){ctx.clearRect(0,0,W,H);pts.forEach(p=>{p.update();p.draw();});requestAnimationFrame(loop);})();
})();

/* ENTER */
DOM.enterBtn.addEventListener('click',()=>{
  DOM.landing.classList.add('exit');
  setTimeout(()=>{DOM.landing.style.display='none';DOM.app.classList.remove('hidden');listenToPlayers();},900);
});

/* AUTH */
auth.onAuthStateChanged(user=>{
  currentUser=user;isAdmin=user?ADMIN_UIDS.includes(user.uid):false;updateAuthUI();
});

function updateAuthUI(){
  if(currentUser&&isAdmin){
    DOM.navUser.classList.remove('hidden');DOM.navUserEmail.textContent=currentUser.email;
    DOM.navAdminLink.style.display='';DOM.loginNavBtn.classList.add('hidden');
    DOM.adminSection.classList.remove('hidden');DOM.mobAdminLink.classList.remove('hidden');
    DOM.mobLoginBtn.classList.add('hidden');DOM.mobLogoutBtn.classList.remove('hidden');
    updateAdminPanel();
  } else {
    DOM.navUser.classList.add('hidden');DOM.navAdminLink.style.display='none';
    DOM.loginNavBtn.classList.remove('hidden');DOM.adminSection.classList.add('hidden');
    DOM.mobAdminLink.classList.add('hidden');DOM.mobLoginBtn.classList.remove('hidden');
    DOM.mobLogoutBtn.classList.add('hidden');
  }
  DOM.loginModal.classList.add('hidden');
}

/* LOGIN MODAL */
function openLoginModal(){
  DOM.loginEmail.value='';DOM.loginPass.value='';hideMsg(DOM.loginMsg);
  DOM.loginModal.classList.remove('hidden');setTimeout(()=>DOM.loginEmail.focus(),200);
}
function closeLoginModal(){DOM.loginModal.classList.add('hidden');}
DOM.loginNavBtn.addEventListener('click',openLoginModal);
DOM.mobLoginBtn.addEventListener('click',openLoginModal);
DOM.closeLoginModal.addEventListener('click',closeLoginModal);
DOM.loginModal.addEventListener('click',e=>{if(e.target===DOM.loginModal)closeLoginModal();});

/* LOGIN SUBMIT */
DOM.loginForm.addEventListener('submit',async e=>{
  e.preventDefault();
  const email=DOM.loginEmail.value.trim(),pass=DOM.loginPass.value;
  if(!email||!pass)return;
  setLoading(DOM.loginBtn,true,'AUTHENTICATING...');hideMsg(DOM.loginMsg);
  try{
    const cred=await auth.signInWithEmailAndPassword(email,pass);
    if(!ADMIN_UIDS.includes(cred.user.uid)){
      await auth.signOut();showMsg(DOM.loginMsg,'⛔ Access denied.','error');
      setLoading(DOM.loginBtn,false,'AUTHENTICATE');return;
    }
    showToast('✅ Welcome, Admin!');setLoading(DOM.loginBtn,false,'AUTHENTICATE');
  }catch(err){
    showMsg(DOM.loginMsg,`⚠️ ${firebaseAuthError(err.code)}`,'error');
    setLoading(DOM.loginBtn,false,'AUTHENTICATE');
  }
});

/* LOGOUT */
async function logout(){await auth.signOut();showToast('👋 Logged out.');}
DOM.logoutBtn.addEventListener('click',logout);
DOM.mobLogoutBtn.addEventListener('click',logout);

/* REGISTER */
DOM.registerForm.addEventListener('submit',async e=>{
  e.preventDefault();
  const name=DOM.regName.value.trim();if(!name)return;
  const dup=Object.values(playersCache).find(p=>p.name.toLowerCase()===name.toLowerCase());
  if(dup){showMsg(DOM.regMsg,`⚠️ "${name}" is already registered.`,'error');return;}
  setLoading(DOM.regBtn,true,'REGISTERING...');hideMsg(DOM.regMsg);
  try{
    await db.ref('players').push({name,goals:0,matches:0,conceded:0,goalDifference:0,points:0,createdAt:Date.now()});
    DOM.regName.value='';showMsg(DOM.regMsg,`✅ ${name} joined O Block E Football!`,'success');
    showToast(`✅ ${name} registered!`);
    if(typeof confetti==='function')confetti({particleCount:80,spread:65,origin:{y:.6},colors:['#00f7ff','#ff2d55','#ffd700']});
  }catch(err){showMsg(DOM.regMsg,`⚠️ ${err.message}`,'error');}
  setLoading(DOM.regBtn,false,'REGISTER NOW');
});

/* REAL-TIME LISTENER */
function listenToPlayers(){
  db.ref('players').on('value',snapshot=>{
    const data=snapshot.val();
    if(!data){playersCache={};renderLeaderboard([]);updateHeroStats([]);if(isAdmin)updateAdminPanel();return;}
    const arr=Object.entries(data).map(([key,val])=>({key,...val}));
    playersCache={};arr.forEach(p=>{playersCache[p.key]=p;});
    arr.sort((a,b)=>(b.goals-a.goals)||(b.goalDifference-a.goalDifference)||(b.points-a.points));
    renderLeaderboard(arr);updateHeroStats(arr);if(isAdmin)updateAdminPanel();
  });
}

/* LEADERBOARD */
const RC=['row-gold','row-silver','row-bronze'],RS=['👑','🥈','🥉'];
function renderLeaderboard(players){
  if(!players.length){DOM.leaderboardBody.innerHTML=`<tr class="empty-row"><td colspan="6">No players yet — register to get started!</td></tr>`;return;}
  DOM.leaderboardBody.innerHTML=players.map((p,i)=>{
    const rc=RC[i]||'',sym=i<3?RS[i]:(i+1),gd=p.goalDifference||0;
    return`<tr class="${rc} row-animate" style="animation-delay:${(i*.04).toFixed(2)}s">
      <td><span class="rank-badge">${sym}</span></td>
      <td style="text-align:left;padding-left:1.5rem;font-weight:700">${escapeHtml(p.name)}</td>
      <td>${p.matches||0}</td><td>${p.goals||0}</td>
      <td class="${gd>=0?'gd-pos':'gd-neg'}">${gd>=0?'+'+gd:gd}</td>
      <td class="pts-cell">${p.points||0}</td></tr>`;
  }).join('');
}

/* HERO STATS */
function updateHeroStats(players){
  animateCount(DOM.hsPlayers,players.length);
  animateCount(DOM.hsGoals,players.reduce((s,p)=>s+(p.goals||0),0));
  animateCount(DOM.hsMatches,Math.floor(players.reduce((s,p)=>s+(p.matches||0),0)/2));
}
function animateCount(el,target){
  const start=parseInt(el.textContent)||0,t0=performance.now();
  (function step(now){const p=Math.min((now-t0)/700,1);el.textContent=Math.round(start+(target-start)*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(step);})(performance.now());
}

/* ADMIN PANEL */
function updateAdminPanel(){updateMatchDropdowns();renderAdminPlayerList();}
function updateMatchDropdowns(){
  const opts=Object.values(playersCache).sort((a,b)=>a.name.localeCompare(b.name)).map(p=>`<option value="${p.key}">${escapeHtml(p.name)}</option>`).join('');
  const base='<option value="">— Select Player —</option>';
  DOM.matchPlayerA.innerHTML=base+opts;DOM.matchPlayerB.innerHTML=base+opts;
}
function renderAdminPlayerList(){
  const players=Object.values(playersCache).sort((a,b)=>a.name.localeCompare(b.name));
  if(!players.length){DOM.adminPlayerList.innerHTML='<p class="no-data">No players yet.</p>';return;}
  DOM.adminPlayerList.innerHTML=players.map(p=>`
    <div class="admin-player-item">
      <div><div class="admin-player-name">${escapeHtml(p.name)}</div>
      <div class="admin-player-stats">MP:${p.matches||0} · G:${p.goals||0} · GD:${p.goalDifference||0} · PTS:${p.points||0}</div></div>
      <button class="btn-delete" onclick="confirmDelete('${p.key}','${escapeHtml(p.name)}')">DELETE</button>
    </div>`).join('');
}

/* MATCH RESULT */
DOM.matchForm.addEventListener('submit',async e=>{
  e.preventDefault();if(!isAdmin){showToast('⛔ Admin only.',true);return;}
  const keyA=DOM.matchPlayerA.value,keyB=DOM.matchPlayerB.value;
  const gA=parseInt(DOM.matchGoalsA.value),gB=parseInt(DOM.matchGoalsB.value);
  if(!keyA||!keyB){showMsg(DOM.matchMsg,'⚠️ Select both players.','error');return;}
  if(keyA===keyB){showMsg(DOM.matchMsg,'⚠️ Players must be different.','error');return;}
  if(isNaN(gA)||isNaN(gB)||gA<0||gB<0){showMsg(DOM.matchMsg,'⚠️ Enter valid goals.','error');return;}
  setLoading(DOM.matchBtn,true,'UPDATING...');hideMsg(DOM.matchMsg);
  const pA=playersCache[keyA],pB=playersCache[keyB];
  const concA=(pA.conceded||0)+gB,concB=(pB.conceded||0)+gA;
  const newGA=(pA.goals||0)+gA,newGB=(pB.goals||0)+gB;
  let ptsA=pA.points||0,ptsB=pB.points||0;
  if(gA>gB)ptsA+=3;else if(gB>gA)ptsB+=3;else{ptsA+=1;ptsB+=1;}
  try{
    await db.ref().update({
      [`players/${keyA}/goals`]:newGA,[`players/${keyA}/conceded`]:concA,
      [`players/${keyA}/goalDifference`]:newGA-concA,[`players/${keyA}/matches`]:(pA.matches||0)+1,[`players/${keyA}/points`]:ptsA,
      [`players/${keyB}/goals`]:newGB,[`players/${keyB}/conceded`]:concB,
      [`players/${keyB}/goalDifference`]:newGB-concB,[`players/${keyB}/matches`]:(pB.matches||0)+1,[`players/${keyB}/points`]:ptsB,
    });
    const result=`${pA.name} ${gA} — ${gB} ${pB.name}`;
    showMsg(DOM.matchMsg,`✅ ${result}`,'success');showToast(`⚽ ${result}`);DOM.matchForm.reset();
    setTimeout(()=>{document.querySelectorAll('#leaderboardBody tr').forEach(tr=>{tr.classList.add('row-flash');setTimeout(()=>tr.classList.remove('row-flash'),700);});},300);
    if(typeof confetti==='function')confetti({particleCount:50,spread:50,origin:{y:.5},colors:['#ffd700','#00f7ff']});
  }catch(err){showMsg(DOM.matchMsg,`⚠️ ${err.message}`,'error');}
  setLoading(DOM.matchBtn,false,'SUBMIT RESULT');
});

/* DELETE */
function confirmDelete(key,name){
  if(!isAdmin)return;deleteTarget=key;
  DOM.deleteModalMsg.textContent=`Delete "${name}" permanently?`;
  DOM.deleteModal.classList.remove('hidden');
}
DOM.deleteCancelBtn.addEventListener('click',()=>{deleteTarget=null;DOM.deleteModal.classList.add('hidden');});
DOM.deleteModal.addEventListener('click',e=>{if(e.target===DOM.deleteModal){deleteTarget=null;DOM.deleteModal.classList.add('hidden');}});
DOM.deleteConfirmBtn.addEventListener('click',async()=>{
  if(!deleteTarget||!isAdmin)return;
  const key=deleteTarget,name=playersCache[key]?.name||'Player';
  deleteTarget=null;DOM.deleteModal.classList.add('hidden');
  try{await db.ref(`players/${key}`).remove();showToast(`🗑️ ${name} deleted.`);}
  catch(err){showToast(`⚠️ ${err.message}`,true);}
});

/* HAMBURGER */
DOM.hamburger.addEventListener('click',()=>DOM.mobileMenu.classList.toggle('closed'));
function closeMobileMenu(){DOM.mobileMenu.classList.add('closed');}

/* SMOOTH SCROLL */
document.addEventListener('click',e=>{
  const a=e.target.closest('a[href^="#"]');if(!a)return;
  e.preventDefault();const t=document.querySelector(a.getAttribute('href'));
  if(t)t.scrollIntoView({behavior:'smooth',block:'start'});
});

/* UTILS */
function showToast(msg,isError=false){
  const t=DOM.toast;t.textContent=msg;t.classList.toggle('toast-error',isError);
  t.classList.add('visible');clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.classList.remove('visible'),3500);
}
function showMsg(el,text,type){el.textContent=text;el.className=`form-msg ${type}`;el.classList.remove('hidden');}
function hideMsg(el){el.classList.add('hidden');el.textContent='';}
function setLoading(btn,loading,label){btn.disabled=loading;const s=btn.querySelector('span');if(s)s.textContent=label;}
function escapeHtml(str){const d=document.createElement('div');d.appendChild(document.createTextNode(str));return d.innerHTML;}
function firebaseAuthError(code){
  return({'auth/invalid-email':'Invalid email.','auth/user-not-found':'No account found.','auth/wrong-password':'Wrong password.',
    'auth/too-many-requests':'Too many attempts. Try later.','auth/invalid-credential':'Invalid email or password.'}[code]||'Authentication failed.');
}

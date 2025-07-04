const PRICE = 38.99;
const SUPPLY = 120_000_000;
const DEFAULT_RATE = 0.003;
const REFERRAL_BONUS = 1;
const REFERRAL_RATE = 0.01;
const MINING_INTERVAL = 24; // hours

// Toast utility for real feedback
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'show';
  setTimeout(() => { el.className = el.className.replace('show',''); }, 2200);
}

function saveUser(user) {
  localStorage.setItem('frn_user', JSON.stringify(user));
}
function loadUser() {
  const data = localStorage.getItem('frn_user');
  return data ? JSON.parse(data) : null;
}
function saveRefUser(username, user) {
  localStorage.setItem('frn_user_' + username, JSON.stringify(user));
}
function loadRefUser(username) {
  const data = localStorage.getItem('frn_user_' + username);
  return data ? JSON.parse(data) : null;
}

let user = loadUser();
let view = 'mine';
let message = '';
let referral = '';
let avatarSeed = '';

(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('ref')) referral = params.get('ref');
})();

function hoursSince(date) {
  if (!date) return MINING_INTERVAL;
  return Math.min(MINING_INTERVAL, (Date.now() - new Date(date)) / (60 * 60 * 1000));
}

function genAvatarSeed(username) {
  // Use username to create a pseudo-random avatar from DiceBear
  return encodeURIComponent(username || 'faroun');
}

function render() {
  const app = document.getElementById('app');
  app.innerHTML = '';
  if (!user) {
    // Registration
    app.innerHTML = `
      <h2>⛏️ Faroun Mining</h2>
      <p>Enter your <b>Telegram username</b> to start mining FRN!</p>
      <input id="username" placeholder="Telegram Username" autocomplete="off"/>
      <input id="referral" placeholder="Referral (optional)" value="${referral || ''}" autocomplete="off"/>
      <button id="regbtn">Start Mining</button>
      <div style="color:#f88;margin-top:8px">${message}</div>
    `;
    document.getElementById('regbtn').onclick = () => {
      const username = document.getElementById('username').value.replace('@','').trim();
      const ref = document.getElementById('referral').value.replace('@','').trim();
      if (!username || username.length < 5) {
        showToast('Enter valid Telegram username (min 5 chars)');
        return;
      }
      if (ref && ref.toLowerCase() === username.toLowerCase()) {
        showToast("You can't refer yourself!");
        return;
      }
      let refUser = ref ? loadRefUser(ref) : null;
      let newUser = {
        username,
        miningRate: DEFAULT_RATE,
        balance: 0,
        lastTap: null,
        referrals: [],
        totalEarned: 0,
        referralBonus: 0,
        streak: 0,
        lastStreak: null,
        history: [],
        nft: [],
        avatar: genAvatarSeed(username),
      };
      if (ref && refUser) {
        refUser.balance += REFERRAL_BONUS;
        refUser.miningRate += REFERRAL_RATE;
        refUser.referrals = refUser.referrals || [];
        refUser.referrals.push(username);
        refUser.history = refUser.history || [];
        refUser.history.unshift(`${new Date().toLocaleString()}: +1 FRN, +0.01 FRN/hr for referring @${username}`);
        saveRefUser(ref, refUser);
        newUser.balance = REFERRAL_BONUS;
        newUser.referralBonus = REFERRAL_BONUS;
        newUser.history.push(`${new Date().toLocaleString()}: +1 FRN from invitation`);
        showToast('Referral applied! You and your referrer each got 1 FRN.');
      }
      user = newUser;
      saveUser(user);
      saveRefUser(username, user);
      render();
    };
    return;
  }

  // Menu
  app.innerHTML += `
    <div class="menu">
      <button class="${view==='mine'?'active':''}" id="minebtn">Mine</button>
      <button class="${view==='profile'?'active':''}" id="profilebtn">Profile</button>
      <button class="${view==='ref'?'active':''}" id="refbtn">Referrals</button>
      <button class="${view==='explore'?'active':''}" id="explorebtn">Explore</button>
    </div>
  `;

  // -------- MINING (HOME) ---------
  if (view === 'mine') {
    const percentMined = ((user.balance || 0) / SUPPLY) * 100;
    let nextTapStr = user.lastTap
      ? hoursSince(user.lastTap) < MINING_INTERVAL
        ? `${Math.ceil(MINING_INTERVAL - hoursSince(user.lastTap))}h`
        : 'Ready!'
      : 'Ready!';
    // Streak logic
    let streakBonus = '';
    if (user.streak > 1) {
      streakBonus = `<div class="badge">🔥 Streak: ${user.streak} days</div>`;
    }
    // NFT badge preview
    let nftBadges = '';
    if (user.nft.length > 0) {
      nftBadges = '<div style="margin:6px 0 12px 0;">' +
        user.nft.map(n => `<span class="badge">${n}</span>`).join('') +
      '</div>';
    }
    app.innerHTML += `
      <div class="balance">${user.balance.toFixed(4)} FRN</div>
      <div class="usd">≈ $${(user.balance * PRICE).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
      <div>Mining rate: <b>${user.miningRate.toFixed(3)} FRN/hr</b></div>
      <div style="margin:8px 0;"><progress value="${percentMined}" max="100" style="width:65%"></progress>
      <span style="font-size:13px;color:#ffd700">${percentMined.toFixed(5)}% mined</span></div>
      ${nftBadges}
      ${streakBonus}
      <button id="tapbtn">Tap to Mine</button>
      <div style="margin:8px 0 0 0;">Next tap: <b>${nextTapStr}</b></div>
      <div style="color:#0fa;margin:8px 0">${message}</div>
      <div class="action-history">
        <h4>Recent Actions</h4>
        <ul>
          ${(user.history||[]).slice(0,4).map(ev=>`<li>${ev}</li>`).join('')}
        </ul>
      </div>
    `;
    document.getElementById('tapbtn').onclick = () => {
      if (user.lastTap && hoursSince(user.lastTap) < MINING_INTERVAL) {
        showToast(`Come back in ${Math.ceil(MINING_INTERVAL - hoursSince(user.lastTap))}h`);
        return;
      }
      const earned = user.miningRate * MINING_INTERVAL;
      user.balance += earned;
      user.lastTap = new Date().toISOString();
      user.totalEarned = (user.totalEarned || 0) + earned;

      // Streak logic
      const today = new Date();
      const lastStreak = user.lastStreak ? new Date(user.lastStreak) : null;
      if (lastStreak && today - lastStreak < 48 * 60 * 60 * 1000 && today.getDate.history.unshift(`${today.toLocaleString()}: +5 FRN streak bonus`);
        if (!user.nft.includes('Streak5')) user.nft.push('Streak5');
      }
      // NFT badges for mining milestones
      if (user.totalEarned >= 100 && !user.nft.includes('Miner100')) {
        user.nft.push('Miner100');
        streakMsg += ' 🏅 NFT: 100 FRN Miner!';
      }
      if (user.referrals.length >= 5 && !user.nft.includes('Ref5')) {
        user.nft.push('Ref5');
        streakMsg += ' 🏅 NFT: 5 Referrals!';
      }

      // Action history
      user.history = user.history || [];
      user.history.unshift(`${today.toLocaleString()}: +${earned.toFixed(4)} FRN (mined)`);
      if (user.history.length > 12) user.history.length = 12;

      saveUser(user);
      saveRefUser(user.username, user);
      showToast(`+${earned.toFixed(4)} FRN mined! ${streakMsg}`);
      render();
    };
  }

  // -------- PROFILE ---------
  else if (view === 'profile') {
    app.innerHTML += `
      <h3>👤 Profile</h3>
      <img class="avatar" src="https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.avatar}" alt="avatar" />
      <div style="font-size:1.15em;font-weight:bold;margin-top:7px;">@${user.username}</div>
      <div style="margin:7px 0 0 0;">Balance: <b>${user.balance.toFixed(4)} FRN</b> ($${(user.balance*PRICE).toLocaleString(undefined, {maximumFractionDigits:2})})</div>
      <div>Mining Rate: <b>${user.miningRate.toFixed(3)} FRN/hr</b></div>
      <div>Total Earned: <b>${(user.totalEarned || 0).toFixed(4)} FRN</b></div>
      <div>Streak: <b>${user.streak||1}</b> days</div>
      <div>Referrals: <b>${user.referrals.length}</b></div>
      <div>Referral Bonus: <b>${user.referralBonus||0} FRN</b></div>
      <div style="margin:10pxStorage.removeItem('frn_user');
        user = null; message = '';
        render();
      }
    };
  }

  // -------- REFERRALS --------
  else if (view === 'ref') {
    app.innerHTML += `
      <h3>🔗 Referral Program</h3>
      <div>Share your link and get <b>+1 FRN</b> and <b>+0.01 FRN/hr</b> for each friend!</div>
      <div class="referral-link" id="reflink">${window.location.origin+window.location.pathname}?ref=${user.username}</div>
      <button id="copyref">Copy Link</button>
      <div style="margin:8px 0;"><b>${user.referrals.length}</b> friends joined with your link!</div>
      ${user.referrals.length > 0
        ? `<ul class="list">${user.referrals.map(r=>'<li>@'+r+'</li>').join('')}</ul>`
        : ''
      }
      <div style="margin-top:12px;">
        <b>How it works:</b>
        <ul class="list">
          <li>1. Copy your invite link</li>
          <li>2. Your friend enters with your code</li>
          <li>3. Both get +1 FRN; you get +0.01 FRN/hr mining speed</li>
        </ul>
      </div>
    `;
    document.getElementById('copyref').onclick = () => {
      const text = `${window.location.origin+window.location.pathname}?ref=${user.username}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
        showToast('Referral link copied!');
      }
    };
  }

  // -------- EXPLORE / FEATURES --------
  else if (view === 'explore')margin-top:20px;color:#aaa;font-size:0.98em;">
        Want more? Suggest features in our Telegram channel!
      </div>
    `;
  }

  app.innerHTML += `
    <footer>
      Faroun (FRN) &copy; 2025 | 1 FRN = $38.99 | Total supply: 120,000,000 FRN
    </footer>
  `;

  // Menu handlers
  document.getElementById('minebtn').onclick = () => { view='mine'; message=''; render(); };
  document.getElementById('profilebtn').onclick = () => { view='profile'; message=''; render(); };
  document.getElementById('refbtn').onclick = () => { view='ref'; message=''; render(); };
  document.getElementById('explorebtn').onclick = () => { view='explore'; message=''; render(); };
}

render();

const PRICE = 38.99;
const msg;
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

(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('ref')) referral = params.get('ref');
})();

function hoursSince(date) {
  if (!date) return MINING_INTERVAL;
  return Math.min(MDate.now() - new Date(date)) / (60 * 60 * 1000));
}

function genAvatarSeed(username) {
  // صورة أوتوماتيكية باستخدام DiceBear
  return encodeURIComponent(username || 'faroun');
}

function render() {
  const app = document.getElementById('app');
  app.innerHTML = '';
  if (!user) {
    app.innerHTML = `
      <h2>⛏️ تعدين فارون</h2>
      <p>أدخل <b>اسم مستخدم تيليجرام</b> لبدء التعدين!</p>
      <input id="username" placeholder="اسم مستخدم تيليجرام" autocomplete="off"/>
      <input id="referral" placeholder="رمز الإحالة (اختياري)" value="${referral || ''}" autocomplete="off"/>
      <button id="regbtn">ابدأ التعدين</button>
      <div style="color:#f88;margin-top:      const ref = document.getElementById('referral').value.replace('@','').trim();
      if (!username || username.length < 5) {
        showToast('يرجى إدخال اسم مستخدم تيليجرام صحيح (5 أحرف على الأقل)');
        return;
      }
      if (ref && ref.toLowerCase() === username.toLowerCase()) {
        showToast("لا يمكنك دعوة نفسك!");
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
        refUser.history.unshift(`${new Date().toLocaleString()}: +1 FRN و +0.01 FRN/ساعة بسبب دعوة @${username}`);
        saveRefUser(ref, refUser);
        newUser.balance = REFERRAL_BONUS;
        newUser.referralBonus = REFERRAL_BONUS;
        newUser.history.push(`${new Date().toLocaleString()}: +1 FRN من دعوة`);
        showToast('تم تطبيق الإحالة! أنت وصديقك حصلتما على 1 FRN.');
      }
      user = newUser;
      saveUser(user);
      saveRefUser(username, user);
      render();
    };
    return;
  }

  // القائمة
  app.innerHTML += `
    <div class="menu">
      <button class="${view==='mine'?'active':''}" id="minebtn">التعدين</button>
      <button class="${view==='profile'?'active':''}" id="profilebtn">ملفي</button>
      <button class="${view==='ref'?'active':''}" id="refbtn">الإحالة</button>
      <button class="${view==='explore'?'active':''}" id="explorebtn">المميزات</button>
    </div>
  `;

  // --- صفحة التعدين الرئيسية ---
  if (view === 'mine') {
    const percentMined = ((user.balance || 0) / SUPPLY) * 100;
    let nextTapStr = user.lastTap
      ? hoursSince(user.lastTap) < MINING_INTERVAL
        ? `${Math.ceil(MINING_INTERVAL - hoursSince(user.lastTap))} ساعة`
        : 'جاهز!'
      : 'جاهز!';
    let streakBonus = '';
    if (user.streak > 1) {
      streakBonus = `<div class="badge">🔥 سلسلة: ${user.streak} يوم</div>`;
    }
    let nftBadges = '';
    if (user.nft.length > 0) {
      nftBadges = '<div style="margin:6px 0 12px 0;">' +
        user.nft.map(n => `<span class="badge">${n}</span>`).join('') +
      '</div>';
    }
    app.innerHTML += `
      <div class="balance">${user.balance.toFixed(4)} FRN</div>
      <div class="usd">≈ $${(user.balance * PRICE).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
      <div>معدل التعدين: <b>${user.miningRate.toFixed(3)} FRN/ساعة</b></div>
      <div style="margin:8px 0;"><progress value="${percentMined}" max="100" style="width:65%"></progress>
      <span style="font-size:13px;color:#ffd700">${percentMined.toFixed(5)}% تم تعدينه</span></div>
      ${nftBadges}
      ${streakBonus}
      <button id="tapbtn">اضغط للتعدين</button>
      <div style="margin:8px 0 0 0;">المحاولة القادمة: <b>${nextTapStr}</b></div>
      <div style="color:#0fa;margin:8px 0">${message = () => {
      if (user.lastTap && hoursSince(user.lastTap) < MINING_INTERVAL) {
        showToast(`انتظر ${Math.ceil(MINING_INTERVAL - hoursSince(user.lastTap))} ساعة قبل المحاولة التالية`);
        return;
      }
      const earned = user.miningRate * MINING_INTERVAL;
      user.balance += earned;
      user.lastTap = new Date().toISOString();
      user.totalEarned = (user.totalEarned || 0) + earned;

      // streak
      const today = new Date();
      const lastStreak = user.lastStreak ? new Date(user.lastStreak) : null;
      if (lastStreak && today - lastStreak < 48 * 60 * 60 * 1000 && today.getDate() !== lastStreak.getDate()) {
        user.streak++;
      } else if (!lastStreak || today - lastStreak > 48 * 60 * 60 * 1000) {
        user.streak = 1;
      }
      user.lastStreak = today.toISOString();

      // مكافأة السلسلة
      let streakMsg = '';
      if (user.streak && user.streak % 5 === 0) {
        user.balance += 5;
        streakMsg = '🔥 +5 FRN مكافأة سلسلة!';
        user.history.unshift(`${today.toLocaleString()}: +5 FRN مكافأة سلسلة`);
        if (!user.nft.includes('سلسلة5')) user.nft.push('سلسلة5');
      }
      // شارات NFT
      if (user.totalEarned >= 100 && !user.nft.includes('عامل100')) {
        user.nft.push('عامل100');
        streakMsg += ' 🏅 شارة: عامل 100 FRN!';
      }
      if (user.referrals.length >= 5 && !user.nft.includes('إحالة5')) {
        user.nft.push('إحالة5');
        streakMsg += ' 🏅 شارة: 5 إحالات!';
      }

      // سجل العمليات
      user.history = user.history || [];
      user.history.unshift(`${today.toLocaleString()}: +${earned.toFixed(4)} FRN (تعدين)`);
      if (user.history.length > 12) user.history.length = 12;

      saveUser(user);
      saveRefUser(user.username, user);
      showToast(`+${earned.toFixed(4)} FRN تم تعدينها! ${streakMsg}`);
      render();
    };
  }

  // --- الملف الشخصي ---
  else if (view === 'profile') {
    app.innerHTML += `
      <h3>👤 الملف الشخصي</h3>
      <img class="avatar" src="https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.avatar}" alt="avatar" />
      <div style="font-size:1.15em;font-weight:bold;margin-top:7px;">@${user.username}</div>
      <div style="margin:7px 0 0 0;">الرصيد: <b>${user.balance.toFixed(4)} FRN</b> ($${(user.balance*PRICE).toLocaleString(undefined, {maximumFractionDigits:2})})</div>
      <div>معدل التعدين: <b>${user.miningRate.toFixed(3)} FRN/ساعة</b></div>
      <div>إجمالي التعدين: <b>${(user.totalEarned || 0).toFixed(4)} FRN</b></div>
      <div>سلسلة التعدين: <b>${user.streak||1}</b> يوم</div>
      <div>عدد الإحالات: <b>${user.referrals.length}</b></div>
      <div>مكافأة الإحالة: <b>${user.referralBonus||0} FRN</b></div>
      <div style="margin:10px 0;">
        ${user.nft.length>0?user.nft.map(n=>`<span class="badge">🏅 ${n}</span>`).join(''):'<span style="color:#555;">لا توجد شارات بعد</span>'}
      </div>
      <hr>
      <button id="logoutbtn">تسجيل خروج</button>
    `;
    document.getElementById('logoutbtn').onclick = () => {
      if (confirm('هل أنت متأكد أنك تريد تسجيل الخروج؟')) {
        localStorage.removeItem('frn_user');
        user = null; message = '';
        render();
      }
    };
  }

  // --- صفحة الإحالة ---
  else if (view === 'ref') {
   flink">${window.location.origin+window.location.pathname}?ref=${user.username}</div>
      <button id="copyref">نسخ الرابط</button>
      <div style="margin:8px 0;"><b>${user.referrals.length}</b> أصدقاء سجلوا برابطك!</div>
      ${user.referrals.length > 0
        ? `<ul class="list">${user.referrals.map(r=>'<li>@'+r+'</li>').join('')}</ul>`
        : ''
      }
      <div style="margin-top:12px;">
        <b>طريقة العمل:</b>
        <ul class="list">
          <li>١. انسخ رابط الدعوة الخاص بك</li>
          <li>٢. صديقك يدخل باسم المستخدم في الحقل</li>
          <li>٣. كل منكما يحصل على +1 FRN وزيادة سرعة التعدين</li>
        </ul>
      </div>
    `;
    document.getElementById('copyref').onclick = () => {
      const text = `${window.location.origin+window.location.pathname}?ref=${user.username}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
        showToast('تم نسخ رابط الدعوة!');
      }
    };
  }

  // --- صفحة المميزات ---
  else if (view === 'explore') {
    app.innerHTML += `
      <h3>🚀 المميزات</h3>
      <div class="features">
        <div class="feature">🏆 <b>لوحة الصدارة</b> (قريبًا)</div>
        <div class="feature">🏅 <b>شارات NFT</b> للمعدنين والمحالين</div>
        <div class="feature">🔥 <b>مكافأة السلسلة اليومية</b> (مفعلة الآن!)</div>
        <div class="feature">💸 <b>سحب إلى تيليجرام</b> (قريبًا)</div>
        <div class="feature">🌕 <b>عملة مستقرة:</b> 1 FRN = $38.99</div>
        <div class="feature">📦 <b>إجمالي العرض:</b> 120,000,000 FRN</div>
      </div>
      <div style="margin-top:20px;color:#aaa;font-size:0.98em;">
        اقترح علينا أفكارًا جديدة في قناة تيليجرام!
      </div>
    `;
  }

  // تفعيل أزرار القائمة
  document.getElementById('minebtn').onclick = () => { view='mine'; message=''; render(); };
  document.getElementById('profilebtn').onclick = () => { view='profile'; message=''; render(); };
  document.getElementById('refbtn').onclick = () => { view='ref'; message=''; render(); };
  document.getElementById('explorebtn').onclick = () => { view='explore'; message=''; render(); };
}

render();

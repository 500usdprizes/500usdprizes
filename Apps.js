import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Helper functions
const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('frn_user')) || null;
  } catch {
    return null;
  }
};
const saveUser = (user) => localStorage.setItem('frn_user', JSON.stringify(user));
const supply = 120_000_000;
const price = 38.99;

function App() {
  // User state
  const [user, setUser] = useState(getStoredUser());
  const [telegram, setTelegram] = useState('');
  const [message, setMessage] = useState('');
  const [referral, setReferral] = useState('');
  const [view, setView] = useState('mine'); // mine, profile, referrals, explore

  // On mount, check for ?ref= in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('ref')) setReferral(params.get('ref'));
  }, []);

  // Save user to localStorage
  useEffect(() => {
    if (user) saveUser(user);
  }, [user]);

  // Calculate hours since last tap
  const hoursSinceLastTap = () => {
    if (!user?.lastTap) return 24;
    return Math.min(
      24,
      (Date.now() - new Date(user.lastTap)) / (60 * 60 * 1000)
    );
  };

  // Calculate percentage mined of supply (for fun)
  const percentMined = ((user?.balance || 0) / supply) * 100;

  // Register/Login
  const handleRegister = () => {
    if (!telegram || !/^[a-zA-Z0-9_]{5,}$/.test(telegram)) {
      setMessage('Enter valid Telegram username (min 5 chars)');
      return;
    }
    if (
      referral &&
      referral.toLowerCase() === telegram.toLowerCase()
    ) {
      setMessage("You can't refer yourself!");
      return;
    }
    // Try to register with referral
    let refUser = null;
    try {
      refUser = JSON.parse(localStorage.getItem('frn_user_' + referral));
    } catch {}
    let newUser = {
      username: telegram,
      miningRate: 0.003,
      balance: 0,
      lastTap: null,
      referrals: [],
      totalEarned: 0,
      referralBonus: 0,
    };
    if (referral && refUser) {
      // Give both 1 FRN and increase referrer's mining rate
      refUser.balance += 1;
      refUser.miningRate += 0.01;
      refUser.referrals = [...(refUser.referrals || []), telegram];
      localStorage.setItem(
        'frn_user_' + referral,
        JSON.stringify(refUser)
      );
      newUser.balance = 1;
      newUser.referralBonus = 1;
      setMessage('Referral applied! You and your referrer each got 1 FRN.');
    }
    // Save user
    setUser(newUser);
    localStorage.setItem('frn_user', JSON.stringify(newUser));
    localStorage.setItem('frn_user_' + telegram, JSON.stringify(newUser));
  };

  // Tap to mine
  const handleTap = () => {
    if (!user) return;
    if (user.lastTap && hoursSinceLastTap() < 24) {
      setMessage(
        `You already mined recently! Come back in ${Math.ceil(
          24 - hoursSinceLastTap()
        )}h`
      );
      return;
    }
    const earned = user.miningRate * 24;
    const updated = {
      ...user,
      balance: user.balance + earned,
      lastTap: new Date().toISOString(),
      totalEarned: (user.totalEarned || 0) + earned,
    };
    setUser(updated);
    setMessage(`You mined ${earned.toFixed(4)} FRN!`);
  };

  // Copy referral link
  const copyReferral = () => {
    if (!user) return;
    navigator.clipboard.writeText(
      `${window.location.origin}?ref=${user.username}`
    );
    setMessage('Referral link copied!');
  };

  // Switch views
  const switchView = (v) => {
    setMessage('');
    setView(v);
  };

  // Explore fun
  const exploreFeatures = [
    {
      title: 'Leaderboard',
      desc: 'See who mined the most FRN (coming soon!)',
    },
    {
      title: 'NFT Badges',
      desc: 'Earn digital badges for streaks and referrals!',
    },
    {
      title: 'Daily Streak Bonus',
      desc: 'Mine every day for bonus FRN!',
    },
    {
      title: 'Withdraw to Telegram',
      desc: 'Connect your Telegram for future airdrops!',
    },
  ];

  // UI
  if (!user)
    return (
      <motion.div
        className="container"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          minHeight: '100vh',
          background:
            'linear-gradient(135deg,#281a47 0%,#1d293f 100%)',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          style={{
            background: '#23233b',
            padding: 30,
            borderRadius: 16,
            boxShadow: '0 2px 32px #0003',
            width: 320,
            textAlign: 'center',
          }}
        >
          <img
            src="https://cdn-icons-png.flaticon.com/512/616/616489.png"
            alt=""
            style={{ width: 64, marginBottom: 10 }}
          />
          <h2>
            <span role="img" aria-label="pickaxe">
              ⛏️
            </span>{' '}
            Faroun Miner
          </h2>
          <p>
            Enter your <b>Telegram username</b> to start mining FRN!
          </p>
          <input
            style={{
              padding: 8,
              margin: '10px 0',
              width: '90%',
              borderRadius: 6,
              border: 'none',
              background: '#191933',
              color: '#fff',
              fontSize: 16,
            }}
            placeholder="Telegram Username"
            value={telegram}
            onChange={(e) => setTelegram(e.target.value.replace('@', ''))}
          />
          <input
            style={{
              padding: 8,
              margin: '10px 0',
              width: '90%',
              borderRadius: 6,
              border: 'none',
              background: '#191933',
              color: '#fff',
              fontSize: 15,
            }}
            placeholder="Referral (optional)"
            value={referral}
            onChange={(e) => setReferral(e.target.value.replace('@', ''))}
          />
          <button
            style={{
              padding: '10px 28px',
              fontSize: 18,
              background: 'linear-gradient(90deg,#a37cf0,#4f8cff)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              marginTop: 12,
              boxShadow: '0 2px 10px #0002',
            }}
            onClick={handleRegister}
          >
            Start Mining
          </button>
          <p style={{ color: '#f88', marginTop: 10 }}>{message}</p>
        </motion.div>
      </motion.div>
    );

  // Main app
  return (
    <motion.div
      className="main-app"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg,#281a47 0%,#1d293f 100%)',
        color: '#fff',
        padding: 0,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Navigation */}
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          background: '#1b1830aa',
          padding: 18,
          fontWeight: 600,
          fontSize: 18,
          letterSpacing: 1,
        }}
      >
        <span
          style={{
            cursor: 'pointer',
            borderBottom: view === 'mine' ? '2px solid #ffb300' : 'none',
          }}
          onClick={() => switchView('mine')}
        >
          Mine
        </span>
        <span
          style={{
            cursor: 'pointer',
            borderBottom: view === 'profile' ? '2px solid #ffb300' : 'none',
          }}
          onClick={() => switchView('profile')}
        >
          Profile
        </span>
        <span
          style={{
            cursor: 'pointer',
            borderBottom: view === 'referrals' ? '2px solid #ffb300' : 'none',
          }}
          onClick={() => switchView('referrals')}
        >
          Referrals
        </span>
        <span
          style={{
            cursor: 'pointer',
            borderBottom: view === 'explore' ? '2px solid #ffb300' : 'none',
          }}
          onClick={() => switchView('explore')}
        >
          Explore
        </span>
      </nav>
      <AnimatePresence>
        {view === 'mine' && (
          <motion.div
            key="mine"
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -60, opacity: 0 }}
            style={{
              textAlign: 'center',
              marginTop: 40,
            }}
          >
            <h1>
              <span role="img" aria-label="pickaxe">
                ⛏️
              </span>{' '}
              Mine FRN
            </h1>
            <motion.div
              style={{
                display: 'inline-block',
                background: 'linear-gradient(110deg,#3d284e,#253057)',
                padding: 24,
                borderRadius: 16,
                minWidth: 260,
                margin: '24px 0',
                boxShadow: '0 0 24px #18143755',
              }}
              whileHover={{ scale: 1.03 }}
            >
              <h2>
                {user.balance.toFixed(4)} <span style={{ color: '#ffd700' }}>FRN</span>
              </h2>
              <h4>
                ≈ ${(user.balance * price).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </h4>
              <p>
                Mining rate:{' '}
                <b style={{ color: '#44e' }}>{user.miningRate.toFixed(3)} FRN/hr</b>
              </p>
              <p>
                <i>
                  Total supply:{' '}
                  <b style={{ color: '#ffb300' }}>
                    {supply.toLocaleString()} FRN
                  </b>
                </i>
              </p>
              <p>
                <progress value={percentMined} max={100} style={{ width: '60%' }} />
                <span style={{ fontSize: 12 }}>
                  {' '}
                  {percentMined.toFixed(5)}% mined
                </span>
              </p>
              <motion.button
                onClick={handleTap}
                whileTap={{ scale: 0.95, backgroundColor: '#4f8cff' }}
                style={{
                  padding: '14px 38px',
                  fontSize: 18,
                  background: 'linear-gradient(90deg,#ffd700,#a37cf0)',
                  color: '#23233b',
                  border: 'none',
                  borderRadius: 10,
                  marginTop: 16,
                  boxShadow: '0 2px 12px #a37cf033',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                Tap to Mine
              </motion.button>
              <p style={{ margin: 8, color: '#fff' }}>
                Next tap:{' '}
                <b>
                  {user.lastTap
                    ? hoursSinceLastTap() < 24
                      ? `${Math.ceil(24 - hoursSinceLastTap())}h`
                      : 'Ready!'
                    : 'Ready!'}
                </b>
              </p>
            </motion.div>
            <p style={{ color: '#0fa', fontWeight: 600 }}>{message}</p>
          </motion.div>
        )}
        {view === 'profile' && (
          <motion.div
            key="profile"
            initial={{ x: -60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 60, opacity: 0 }}
            style={{
              textAlign: 'center',
              marginTop: 40,
              minHeight: 300,
            }}
          >
            <h2>
              <span role="img" aria-label="user">
                👤
              </span>{' '}
              Profile
            </h2>
            <div
              style={{
                display: 'inline-block',
                background: '#23233b',
                padding: 22,
                borderRadius: 12,
                minWidth: 250,
                boxShadow: '0 2px 16px #0002',
              }}
            >
              <p>
                Telegram: <b>@{user.username}</b>
              </p>
              <p>
                Balance:{' '}
                <b>
                  {user.balance.toFixed(4)} FRN (${(user.balance * price).toLocaleString(undefined, { maximumFractionDigits: 2 })})
                </b>
              </p>
              <p>
                Mining Rate: <b>{user.miningRate.toFixed(3)} FRN/hr</b>
              </p>
              <p>
                Total Earned: <b>{(user.totalEarned || 0).toFixed(4)} FRN</b>
              </p>
              <p>
                Referrals: <b>{user.referrals.length}</b>
              </p>
              {user.referralBonus > 0 && (
                <p>
                  Referral Bonus: <b>{user.referralBonus} FRN</b>
                </p>
              )}
            </div>
          </motion.div>
        )}
        {view === 'referrals' && (
          <motion.div
            key="referrals"
            initial={{ x: -60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 60, opacity: 0 }}
            style={{
              textAlign: 'center',
              marginTop: 40,
              minHeight: 300,
            }}
          >
            <h2>
              <span role="img" aria-label="link">
                🔗
              </span>{' '}
              Referral Program
            </h2>
            <div
              style={{
                background: '#23233b',
                display: 'inline-block',
                padding: 22,
                borderRadius: 12,
                minWidth: 250,
                boxShadow: '0 2px 16px #0002',
              }}
            >
              <p>
                Share your link and get <b>+1 FRN</b> and <b>+0.01 FRN/hr</b> for each friend!
              </p>
              <input
                style={{
                  padding: 8,
                  borderRadius: 6,
                  border: 'none',
                  background: '#191933',
                  color: '#fff',
                  width: '80%',
                  margin: 4,
                  fontSize: 15,
                }}
                value={`${window.location.origin}?ref=${user.username}`}
                readOnly
              />
              <button
                onClick={copyReferral}
                style={{
                  padding: '6px 20px',
                  fontSize: 16,
                  background: 'linear-gradient(90deg,#a37cf0,#4f8cff)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  marginLeft: 10,
                  cursor: 'pointer',
                }}
              >
                Copy
              </button>
              <p style={{ margin: 14 }}>
                <b>{user.referrals.length}</b> friends joined with your link!
              </p>
              {user.referrals.length > 0 && (
                <ul style={{ color: '#9cf', fontWeight: 500 }}>
                  {user.referrals.map((r, i) => (
                    <li key={i}>@{r}</li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
        {view === 'explore' && (
          <motion.div
            key="explore"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            style={{
              textAlign: 'center',
              marginTop: 40,
              minHeight: 300,
            }}
          >
            <h2>
              <span role="img" aria-label="stars">
                ✨
              </span>{' '}
              Explore Features
            </h2>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 20,
                marginTop: 16,
              }}
            >
              {exploreFeatures.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05, rotate: [-1, 1, -1] }}
                  style={{
                    background: '#2a2057',
                    padding: 16,
                    borderRadius: 10,
                    width: 220,
                    margin: 7,
                    boxShadow: '0 2px 14px #0002',
                  }}
                >
                  <h4 style={{ color: '#ffd700' }}>{f.title}</h4>
                  <p style={{ fontSize: 15, color: '#fff' }}>{f.desc}</p>
                </motion.div>
              ))}
            </div>
            <p style={{ marginTop: 32, color: '#fff8' }}>
              More coming soon. Stay tuned!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      <footer
        style={{
          textAlign: 'center',
          color: '#aaa',
          margin: '44px 0 8px',
          fontSize: 15,
        }}
      >
        Faroun (FRN) &copy; 2025 | 1 FRN = $38.99 | Total supply: 120,000,000 FRN
      </footer>
    </motion.div>
  );
}

export default App;
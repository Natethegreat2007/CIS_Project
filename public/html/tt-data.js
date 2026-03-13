/* ============================================================
   tt-data.js  —  Tourist Tome shared data + state layer
   Include this on EVERY page with:  <script src="tt-data.js"></script>
   ============================================================ */

const TT = (function () {

  // ── MOCK DATA ─────────────────────────────────────────────

  const ATTRACTIONS = [
    { id:1, name:"The Great Blue Hole",  cat:"Marine",         loc:"Lighthouse Reef",       price:50,  rating:4.3, img:"bluehole.jpg",   desc:"A world-famous marine sinkhole, 300m across and 125m deep. One of the top dive sites on Earth.", color:"#1565c0" },
    { id:2, name:"Xunantunich",          cat:"Archaeological", loc:"Cayo District",          price:20,  rating:4.7, img:"ruins.jpg",       desc:"Iconic Maya archaeological site featuring the towering El Castillo pyramid overlooking the Mopan River.", color:"#6d4c41" },
    { id:3, name:"Belize Barrier Reef",  cat:"Marine",         loc:"Caribbean Sea",          price:35,  rating:4.8, img:"reef.jpg",        desc:"The second-largest coral reef system in the world and a UNESCO World Heritage Site.", color:"#00838f" },
    { id:4, name:"Caracol",              cat:"Archaeological", loc:"Chiquibul Forest",       price:15,  rating:4.5, img:"caracol.jpg",     desc:"The largest Maya archaeological site in Belize, deep in the Chiquibul Forest Reserve.", color:"#558b2f" },
    { id:5, name:"Cockscomb Basin",      cat:"Wildlife",       loc:"Stann Creek District",   price:10,  rating:4.6, img:"Cockscomb.jpg",   desc:"World's first jaguar sanctuary. Home to over 300 bird species and diverse Belizean wildlife.", color:"#2e7d32" },
    { id:6, name:"Lamanai",              cat:"Archaeological", loc:"Orange Walk District",   price:20,  rating:4.4, img:"Lamanai.jpg",     desc:"Ancient Maya temple complex accessible only by a scenic river boat safari through the jungle.", color:"#4e342e" },
  ];

  const TOURS = [
    { id:1, attrID:1, name:"Blue Hole Dive Adventure",  operator:"Belize Pro Divers",   duration:"6 hrs", price:250, cap:12, img:"tour1.jpg", color:"#1565c0", desc:"Full-day scuba diving expedition into the iconic Blue Hole. Equipment, guide and lunch included." },
    { id:2, attrID:1, name:"Aerial Blue Hole Tour",     operator:"Sky Belize Aviation",  duration:"2 hrs", price:180, cap:5,  img:"tour2.jpg", color:"#0288d1", desc:"Breathtaking sightseeing flight over the Blue Hole and Lighthouse Reef atolls." },
    { id:3, attrID:3, name:"Snorkeling Combo",          operator:"Reef Runners",         duration:"4 hrs", price:120, cap:20, img:"tour3.jpg", color:"#00838f", desc:"Snorkeling at the Blue Hole perimeter and world-famous barrier reef." },
    { id:4, attrID:2, name:"Exploring Maya Ruins",      operator:"Cayo Adventures",      duration:"5 hrs", price:75,  cap:15, img:"tour4.jpg", color:"#6d4c41", desc:"Guided walk through Xunantunich with a certified archaeologist. Transport included." },
    { id:5, attrID:5, name:"Jaguar Sanctuary Trek",     operator:"Cockscomb Eco Tours",  duration:"4 hrs", price:65,  cap:10, img:"tour5.jpg", color:"#2e7d32", desc:"Guided hike through the world's first jaguar sanctuary. Spot wildlife and native birds." },
    { id:6, attrID:6, name:"Lamanai River Safari",      operator:"Orange Walk Tours",    duration:"6 hrs", price:85,  cap:14, img:"tour6.jpg", color:"#4e342e", desc:"Scenic boat ride through the jungle to the ancient Lamanai temple complex." },
  ];

  // Seed demo accounts  (role: admin | operator | tourist)
  const DEMO_USERS = [
    { id:1, email:"admin@touristtome.bz",    password:"admin123",    name:"Nathan Scott",  role:"admin"    },
    { id:2, email:"operator@touristtome.bz", password:"operator123", name:"Nicole Burke",  role:"operator" },
    { id:3, email:"tourist@touristtome.bz",  password:"tourist123",  name:"Gavin Harban",  role:"tourist"  },
  ];

  // ── SEASONAL PRICING ──────────────────────────────────────
  function getMultiplier(dateStr) {
    const m = new Date(dateStr).getMonth() + 1;
    if ([12,1].includes(m))    return { label:"Peak",     mult:1.25 };
    if ([6,7,8].includes(m))   return { label:"Off-Peak", mult:0.85 };
    return                             { label:"Standard", mult:1.00 };
  }

  // ── STORAGE HELPERS ───────────────────────────────────────
  function load(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }

  // ── AUTH ──────────────────────────────────────────────────
  const auth = {
    /** Login with email + password. Returns user object or null. */
    login(email, password) {
      const users = load('tt_users', DEMO_USERS);
      const u = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      if (!u) return null;
      this._setSession(u);
      return u;
    },

    /** Login via Google (pass decoded credential payload). */
    loginGoogle(payload) {
      let users = load('tt_users', DEMO_USERS);
      let u = users.find(u => u.email.toLowerCase() === payload.email.toLowerCase());
      if (!u) {
        // Auto-register as tourist
        u = { id: Date.now(), email: payload.email, password: null,
               name: payload.name, role: 'tourist', google: true };
        users.push(u);
        save('tt_users', users);
      }
      this._setSession(u);
      return u;
    },

    /** Register a new user. Returns { ok, error }. */
    register({ email, password, name, role }) {
      let users = load('tt_users', DEMO_USERS);
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { ok: false, error: 'That email is already registered.' };
      }
      const u = { id: Date.now(), email, password, name, role: role || 'tourist' };
      users.push(u);
      save('tt_users', users);
      this._setSession(u);
      return { ok: true, user: u };
    },

    _setSession(u) {
      sessionStorage.setItem('tt_session', JSON.stringify({
        id: u.id, name: u.name, email: u.email, role: u.role
      }));
    },

    logout() { sessionStorage.removeItem('tt_session'); window.location.href = 'login.html'; },

    /** Returns current session object or null. */
    session() {
      try { return JSON.parse(sessionStorage.getItem('tt_session')); } catch { return null; }
    },

    /** Redirect to login if not logged in. Call at top of protected pages. */
    require() {
      if (!this.session()) window.location.href = 'login.html';
    },
  };

  // ── BOOKINGS ──────────────────────────────────────────────
  const bookings = {
    all() { return load('tt_bookings', []); },

    mine() {
      const s = auth.session();
      if (!s) return [];
      return this.all().filter(b => b.userID === s.id);
    },

    create({ tourID, tourDate, personCount, paymentMethod }) {
      const tour = TOURS.find(t => t.id === tourID);
      if (!tour) return { ok: false, error: 'Tour not found.' };
      const s = auth.session();
      if (!s)   return { ok: false, error: 'Not logged in.' };

      const season   = getMultiplier(tourDate);
      const total    = parseFloat((tour.price * personCount * season.mult).toFixed(2));
      const attr     = ATTRACTIONS.find(a => a.id === tour.attrID);

      const booking = {
        id:            Date.now(),
        userID:        s.id,
        tourID,
        tourName:      tour.name,
        attraction:    attr ? attr.name : '',
        location:      attr ? attr.loc  : '',
        tourDate,
        personCount,
        paymentMethod,
        total,
        season:        season.label,
        status:        'Confirmed',
        bookedAt:      new Date().toISOString(),
      };

      const all = this.all();
      all.unshift(booking);
      save('tt_bookings', all);
      return { ok: true, booking };
    },

    cancel(bookingID) {
      const all = this.all();
      const idx = all.findIndex(b => b.id === bookingID);
      if (idx === -1) return false;
      all[idx].status = 'Cancelled';
      save('tt_bookings', all);
      return true;
    },
  };

  // ── REVIEWS ───────────────────────────────────────────────
  const reviews = {
    all()        { return load('tt_reviews', _seedReviews()); },
    forTour(tid) { return this.all().filter(r => r.tourID === tid); },

    avgRating(tid) {
      const rs = this.forTour(tid);
      if (!rs.length) return null;
      return (rs.reduce((s,r)=>s+r.rating,0)/rs.length).toFixed(1);
    },

    submit({ tourID, rating, comment }) {
      const s = auth.session();
      if (!s) return { ok:false, error:'Not logged in.' };
      const all = this.all();
      // One per user per tour
      if (all.find(r => r.tourID === tourID && r.userID === s.id)) {
        return { ok:false, error:'You already reviewed this tour.' };
      }
      const r = { id:Date.now(), tourID, userID:s.id, userName:s.name, rating, comment, date:new Date().toISOString() };
      all.unshift(r);
      save('tt_reviews', all);
      return { ok:true, review:r };
    },
  };

  function _seedReviews() {
    return [
      { id:1, tourID:1, userID:99, userName:'BARRETTSHO67',     rating:1, comment:'I ruined my trip.',          date:'2026-02-01' },
      { id:2, tourID:1, userID:98, userName:'SOFIA DE PAZ',      rating:2, comment:'The trip was bad.',          date:'2026-02-03' },
      { id:3, tourID:1, userID:97, userName:'EDWARDO COCOM',     rating:5, comment:'No chihuahua in sight!!!',   date:'2026-02-10' },
      { id:4, tourID:4, userID:96, userName:'ANDREW CABLE',      rating:5, comment:'Best day of my vacation!',   date:'2026-02-14' },
      { id:5, tourID:5, userID:95, userName:'HILARY ROBERT',     rating:3, comment:'Nice but a bit cramped.',    date:'2026-02-18' },
      { id:6, tourID:3, userID:94, userName:'STACY SUTHERLAND',  rating:4, comment:'Incredible reef colours.',   date:'2026-02-22' },
    ];
  }

  // ── NAV HELPERS ───────────────────────────────────────────
  /** Call after DOM loads on every page to fill in the user name chip. */
  function initNav() {
    const s = auth.session();
    const el = document.getElementById('navUser');
    if (el && s) el.textContent = s.name.split(' ')[0].toUpperCase();

    // Wire logout button
    const btn = document.getElementById('navLogout');
    if (btn) btn.addEventListener('click', () => auth.logout());
  }

  // ── STAR HELPER ───────────────────────────────────────────
  function starsHTML(rating, size = 18) {
    let out = '';
    for (let i = 1; i <= 5; i++) {
      const color = i <= Math.round(rating) ? '#fbc02d' : 'rgba(251,192,45,0.2)';
      out += `<span style="color:${color};font-size:${size}px;">&#9733;</span>`;
    }
    return out;
  }

  // ── IMAGE WITH COLOUR FALLBACK ────────────────────────────
  /** Returns an img tag that falls back to a solid colour + initials */
  function imgFallback(src, alt, color, style = '') {
    return `<img src="${src}" alt="${alt}" style="${style}"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
    <div style="display:none;width:100%;height:100%;background:${color};
      align-items:center;justify-content:center;font-family:'Luckiest Guy';
      font-size:clamp(14px,3vw,28px);color:rgba(255,255,255,0.7);text-align:center;padding:8px;">
      ${alt.substring(0,14)}
    </div>`;
  }

  // ── PUBLIC API ────────────────────────────────────────────
  return { ATTRACTIONS, TOURS, auth, bookings, reviews,
           getMultiplier, starsHTML, imgFallback, initNav };

})();

// Auto-init nav on every page load
document.addEventListener('DOMContentLoaded', () => TT.initNav());

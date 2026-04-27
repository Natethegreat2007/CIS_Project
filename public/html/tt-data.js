const TT = (function () {
  const API_BASE = '/api';
  const SESSION_KEY = 'tt_session';
  const TOKEN_KEY = 'tt_token';

  const ATTRACTIONS = [];
  const TOURS = [];

  function replaceArray(target, items) {
    target.splice(0, target.length, ...items);
    return target;
  }

  function readSession() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY));
    } catch (error) {
      return null;
    }
  }

  function writeSession(user, token) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    }
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  }

  function token() {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  async function request(path, options) {
    const opts = options || {};
    const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});

    if (opts.auth !== false && token()) {
      headers.Authorization = 'Bearer ' + token();
    }

    const response = await fetch(API_BASE + path, {
      method: opts.method || 'GET',
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });

    const payload = await response.json().catch(function () { return {}; });
    if (!response.ok) {
      if (response.status === 401) {
        clearSession();
      }
      const error = new Error(payload.error || 'Request failed.');
      error.status = response.status;
      throw error;
    }

    return payload;
  }

  function redirectForRole(role) {
    if (role === 'admin') {
      return 'dashboard.html';
    }

    if (role === 'operator') {
      return 'managetour.html';
    }

    return 'home.html';
  }

  function requireAuth(roles) {
    const user = readSession();
    const allowedRoles = roles || [];

    if (!user || !token()) {
      window.location.href = 'login.html';
      return false;
    }

    if (allowedRoles.length && allowedRoles.indexOf(user.role) === -1) {
      window.location.href = redirectForRole(user.role);
      return false;
    }

    return true;
  }

  async function refreshSession() {
    if (!token()) {
      return null;
    }

    const payload = await request('/auth/me');
    writeSession(payload.user, token());
    return payload.user;
  }

  async function initPage(options) {
    const opts = options || {};
    const roles = opts.roles || [];

    if (opts.requireAuth && !requireAuth(roles)) {
      return null;
    }

    if (token()) {
      try {
        const user = await refreshSession();
        if (opts.requireAuth && !user) {
          window.location.href = 'login.html';
          return null;
        }

        if (user && roles.length && roles.indexOf(user.role) === -1) {
          window.location.href = redirectForRole(user.role);
          return null;
        }
      } catch (error) {
        if (opts.requireAuth) {
          window.location.href = 'login.html';
          return null;
        }
      }
    }

    if (opts.loadCatalog) {
      await catalog.load();
    }

    initNav();
    return auth.session();
  }

  const auth = {
    async login(email, password) {
      const payload = await request('/auth/login', {
        method: 'POST',
        body: { email: email, password: password },
        auth: false,
      });
      writeSession(payload.user, payload.token);
      return payload.user;
    },

    async loginGoogle(payload) {
      const response = await request('/auth/google', {
        method: 'POST',
        body: payload,
        auth: false,
      });
      writeSession(response.user, response.token);
      return response.user;
    },

    async register(data) {
      const payload = await request('/auth/register', {
        method: 'POST',
        body: data,
        auth: false,
      });
      writeSession(payload.user, payload.token);
      return payload.user;
    },

    require: function (roles) {
      return requireAuth(roles);
    },

    async refresh() {
      return refreshSession();
    },

    session: function () {
      return readSession();
    },

    logout: function () {
      clearSession();
      window.location.href = 'login.html';
    },
  };

  const catalog = {
    async load(filters) {
      const opts = filters || {};
      const query = new URLSearchParams();

      if (opts.search) {
        query.set('search', opts.search);
      }

      if (opts.category) {
        query.set('category', opts.category);
      }

      const suffix = query.toString() ? '?' + query.toString() : '';
      const results = await Promise.all([
        request('/attractions' + suffix, { auth: false }),
        request('/tours' + (opts.attractionId ? '?attractionId=' + opts.attractionId : ''), { auth: false }),
      ]);

      replaceArray(ATTRACTIONS, results[0].attractions || []);
      replaceArray(TOURS, results[1].tours || []);
      return { attractions: ATTRACTIONS, tours: TOURS };
    },
  };

  const attractions = {
    async all(filters) {
      const params = new URLSearchParams();
      if (filters && filters.search) params.set('search', filters.search);
      if (filters && filters.category) params.set('category', filters.category);
      const suffix = params.toString() ? '?' + params.toString() : '';
      const payload = await request('/attractions' + suffix, { auth: false });
      replaceArray(ATTRACTIONS, payload.attractions || []);
      return payload.attractions || [];
    },

    async categories() {
      const payload = await request('/attractions/meta/categories', { auth: false });
      return payload.categories || [];
    },

    async create(data) {
      const payload = await request('/attractions', {
        method: 'POST',
        body: data,
      });
      return payload.attraction;
    },

    async get(id) {
      const payload = await request('/attractions/' + id, { auth: false });
      return payload.attraction;
    },
  };

  const tours = {
    async all(filters) {
      const params = new URLSearchParams();
      if (filters && filters.attractionId) params.set('attractionId', filters.attractionId);
      if (filters && filters.search) params.set('search', filters.search);
      const suffix = params.toString() ? '?' + params.toString() : '';
      const payload = await request('/tours' + suffix, { auth: false });
      replaceArray(TOURS, payload.tours || []);
      return payload.tours || [];
    },

    async availability(id, month) {
      const payload = await request('/tours/' + id + '/availability?month=' + month, { auth: false });
      return payload.availability || [];
    },

    async get(id) {
      const payload = await request('/tours/' + id, { auth: false });
      return payload.tour;
    },

    async save(data) {
      if (data.id) {
        const payload = await request('/tours/' + data.id, {
          method: 'PUT',
          body: data,
        });
        return payload.tour;
      }

      const created = await request('/tours', {
        method: 'POST',
        body: data,
      });
      return created.tour;
    },
  };

  const bookings = {
    async mine() {
      const payload = await request('/bookings/mine');
      return payload.bookings || [];
    },

    async create(data) {
      const payload = await request('/bookings', {
        method: 'POST',
        body: data,
      });
      return payload.booking;
    },

    async cancel(id) {
      const payload = await request('/bookings/' + id + '/cancel', {
        method: 'PATCH',
      });
      return payload.booking;
    },
  };

  const reviews = {
    async all(filters) {
      const params = new URLSearchParams();
      if (filters && filters.tourID) params.set('tourID', filters.tourID);
      if (filters && filters.attractionID) params.set('attractionID', filters.attractionID);
      const suffix = params.toString() ? '?' + params.toString() : '';
      const payload = await request('/reviews' + suffix, { auth: false });
      return payload.reviews || [];
    },

    async forTour(tourID) {
      return this.all({ tourID: tourID });
    },

    async submit(data) {
      const payload = await request('/reviews', {
        method: 'POST',
        body: data,
      });
      return payload.review;
    },
  };

  const analytics = {
    async dashboard() {
      const payload = await request('/analytics/dashboard');
      return payload;
    },
  };

  const operators = {
    async mineTours() {
      const payload = await request('/operators/me/tours');
      return payload.tours || [];
    },

    async all() {
      const payload = await request('/operators', { auth: false });
      return payload.operators || [];
    },
  };

  const users = {
    async all() {
      const payload = await request('/users');
      return payload.users || [];
    },
  };

  function getMultiplier(dateStr) {
    const m = new Date(dateStr).getMonth() + 1;
    if ([12, 1].indexOf(m) !== -1) return { label: 'Peak', mult: 1.25 };
    if ([6, 7, 8].indexOf(m) !== -1) return { label: 'Off-Peak', mult: 0.85 };
    return { label: 'Standard', mult: 1.00 };
  }

  function starsHTML(rating, size) {
    var out = '';
    var finalSize = size || 18;
    for (var i = 1; i <= 5; i++) {
      var color = i <= Math.round(rating) ? '#fbc02d' : 'rgba(251,192,45,0.2)';
      out += '<span style="color:' + color + ';font-size:' + finalSize + 'px;">&#9733;</span>';
    }
    return out;
  }

  function imgFallback(src, alt, color, style) {
    return '<img src="' + src + '" alt="' + alt + '" style="' + (style || '') + '"' +
      ' onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
      '<div style="display:none;width:100%;height:100%;background:' + color + ';align-items:center;justify-content:center;font-family:\'Luckiest Guy\';font-size:clamp(14px,3vw,28px);color:rgba(255,255,255,0.7);text-align:center;padding:8px;">' +
      alt.substring(0, 14) +
      '</div>';
  }

  function initNav() {
    const s = auth.session();
    const el = document.getElementById('navUser');
    if (el && s && s.name) {
      el.textContent = s.name.split(' ')[0].toUpperCase();
    }

    const btn = document.getElementById('navLogout');
    if (btn) {
      btn.onclick = function () {
        auth.logout();
      };
    }
  }

  return {
    ATTRACTIONS: ATTRACTIONS,
    TOURS: TOURS,
    analytics: analytics,
    attractions: attractions,
    auth: auth,
    bookings: bookings,
    catalog: catalog,
    getMultiplier: getMultiplier,
    imgFallback: imgFallback,
    initNav: initNav,
    initPage: initPage,
    operators: operators,
    redirectForRole: redirectForRole,
    reviews: reviews,
    starsHTML: starsHTML,
    tours: tours,
    users: users,
  };
})();

document.addEventListener('DOMContentLoaded', function () {
  TT.initNav();
});

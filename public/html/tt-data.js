/* ============================================================
   Tourist Tome shared API + state layer
   ============================================================ */

const TT = (function () {
  const API_BASE = '/api';
  const SESSION_KEY = 'tt_session';
  const TOKEN_KEY = 'tt_token';
  const LEGACY_USER_KEY = 'tt_user';
  const LEGACY_ROLE_KEY = 'tt_role';

  const ATTRACTIONS = [];
  const TOURS = [];
  const REVIEWS = [];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function parseJson(text) {
    try {
      return text ? JSON.parse(text) : null;
    } catch (_error) {
      return null;
    }
  }

  function request(method, path, body) {
    const xhr = new XMLHttpRequest();
    xhr.open(method, API_BASE + path, false);
    xhr.setRequestHeader('Accept', 'application/json');

    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    }

    if (body !== undefined && body !== null) {
      xhr.setRequestHeader('Content-Type', 'application/json');
    }

    try {
      xhr.send(body !== undefined && body !== null ? JSON.stringify(body) : null);
    } catch (error) {
      return {
        ok: false,
        status: 0,
        error: 'Unable to reach the Tourist Tome server. Make sure the app is running.',
      };
    }

    const data = parseJson(xhr.responseText);
    const ok = xhr.status >= 200 && xhr.status < 300;

    if (!ok && xhr.status === 401) {
      clearSession();
    }

    return {
      ok: ok,
      status: xhr.status,
      data: data,
      error: data && (data.error || data.message) ? (data.error || data.message) : 'Request failed.',
    };
  }

  function saveSession(token, user) {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    sessionStorage.setItem(LEGACY_USER_KEY, user.name || '');
    sessionStorage.setItem(LEGACY_ROLE_KEY, user.role || '');
  }

  function clearSession() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(LEGACY_USER_KEY);
    sessionStorage.removeItem(LEGACY_ROLE_KEY);
  }

  function getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      return null;
    }
  }

  function routeForRole(role) {
    if (role === 'admin') return 'dashboard.html';
    if (role === 'operator') return 'managetour.html';
    return 'home.html';
  }

  function replaceArray(target, nextItems) {
    target.splice(0, target.length);
    nextItems.forEach(function (item) {
      target.push(item);
    });
  }

  function loadBootstrap() {
    const result = request('GET', '/bootstrap');
    if (!result.ok || !result.data) {
      return result;
    }

    replaceArray(ATTRACTIONS, result.data.attractions || []);
    replaceArray(TOURS, result.data.tours || []);
    replaceArray(REVIEWS, result.data.reviews || []);

    if (sessionStorage.getItem(TOKEN_KEY) && !result.data.currentUser) {
      clearSession();
    } else if (result.data.currentUser) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(result.data.currentUser));
      sessionStorage.setItem(LEGACY_USER_KEY, result.data.currentUser.name || '');
      sessionStorage.setItem(LEGACY_ROLE_KEY, result.data.currentUser.role || '');
    }

    return { ok: true, data: result.data };
  }

  function getMultiplier(dateStr) {
    const m = new Date(dateStr).getMonth() + 1;
    if ([12, 1].includes(m)) return { label: 'Peak', mult: 1.25 };
    if ([6, 7, 8].includes(m)) return { label: 'Off-Peak', mult: 0.85 };
    return { label: 'Standard', mult: 1.0 };
  }

  function starsHTML(rating, size) {
    const numericRating = Number(rating || 0);
    let out = '';
    for (let i = 1; i <= 5; i += 1) {
      const color = i <= Math.round(numericRating) ? '#fbc02d' : 'rgba(251,192,45,0.2)';
      out += '<span style="color:' + color + ';font-size:' + (size || 18) + 'px;">&#9733;</span>';
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
    const session = getSession();
    const el = document.getElementById('navUser');
    if (el) {
      el.textContent = session ? session.name.split(' ')[0].toUpperCase() : '';
    }

    const btn = document.getElementById('navLogout');
    if (btn && !btn.dataset.ttBound) {
      btn.dataset.ttBound = '1';
      btn.addEventListener('click', function () {
        auth.logout();
      });
    }
  }

  const auth = {
    login: function (email, password) {
      const result = request('POST', '/auth/login', { email: email, password: password });
      if (!result.ok || !result.data) {
        return { ok: false, error: result.error };
      }

      saveSession(result.data.token, result.data.user);
      loadBootstrap();
      return { ok: true, user: result.data.user };
    },

    register: function (payload) {
      const result = request('POST', '/auth/register', payload);
      if (!result.ok || !result.data) {
        return { ok: false, error: result.error };
      }

      saveSession(result.data.token, result.data.user);
      loadBootstrap();
      return { ok: true, user: result.data.user };
    },

    loginGoogle: function (payload) {
      const result = request('POST', '/auth/google', payload);
      if (!result.ok || !result.data) {
        return { ok: false, error: result.error };
      }

      saveSession(result.data.token, result.data.user);
      loadBootstrap();
      return { ok: true, user: result.data.user };
    },

    session: function () {
      return getSession();
    },

    require: function (allowedRoles) {
      const session = getSession();
      if (!session) {
        window.location.href = 'login.html';
        return false;
      }

      if (allowedRoles) {
        const list = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        if (list.indexOf(session.role) === -1) {
          window.location.href = routeForRole(session.role);
          return false;
        }
      }

      return true;
    },

    logout: function () {
      clearSession();
      window.location.href = 'login.html';
    },
  };

  const bookings = {
    mine: function () {
      const result = request('GET', '/bookings/mine');
      return result.ok && result.data ? result.data : [];
    },

    create: function (payload) {
      const result = request('POST', '/bookings', payload);
      if (!result.ok || !result.data) {
        return { ok: false, error: result.error };
      }
      return { ok: true, booking: result.data };
    },

    cancel: function (bookingId) {
      const result = request('PATCH', '/bookings/' + bookingId + '/cancel');
      return result.ok;
    },
  };

  const reviews = {
    reload: function () {
      const result = request('GET', '/reviews');
      if (result.ok && result.data) {
        replaceArray(REVIEWS, result.data);
      }
      return clone(REVIEWS);
    },

    all: function () {
      return clone(REVIEWS);
    },

    forTour: function (tourId) {
      return clone(REVIEWS.filter(function (review) {
        return review.tourID === tourId;
      }));
    },

    avgRating: function (tourId) {
      const tourReviews = REVIEWS.filter(function (review) {
        return review.tourID === tourId;
      });
      if (!tourReviews.length) {
        return null;
      }
      const avg = tourReviews.reduce(function (sum, review) {
        return sum + Number(review.rating || 0);
      }, 0) / tourReviews.length;
      return avg.toFixed(1);
    },

    submit: function (payload) {
      const result = request('POST', '/reviews', payload);
      if (!result.ok || !result.data) {
        return { ok: false, error: result.error };
      }

      REVIEWS.unshift(result.data);
      return { ok: true, review: result.data };
    },
  };

  const attractions = {
    list: function () {
      return clone(ATTRACTIONS);
    },

    create: function (payload) {
      const result = request('POST', '/attractions', payload);
      if (!result.ok || !result.data) {
        return { ok: false, error: result.error };
      }

      loadBootstrap();
      return { ok: true, attraction: result.data };
    },
  };

  const tours = {
    list: function () {
      return clone(TOURS);
    },

    mine: function () {
      const result = request('GET', '/tours/mine');
      return result.ok && result.data ? result.data : [];
    },

    save: function (payload) {
      const hasId = Boolean(payload.id);
      const path = hasId ? '/tours/' + payload.id : '/tours';
      const method = hasId ? 'PUT' : 'POST';
      const result = request(method, path, payload);
      if (!result.ok || !result.data) {
        return { ok: false, error: result.error };
      }

      loadBootstrap();
      return { ok: true, tour: result.data };
    },

    getAvailability: function (tourId, year, month) {
      const result = request('GET', '/tours/' + tourId + '/availability?year=' + year + '&month=' + month);
      return result.ok && result.data ? result.data : [];
    },
  };

  const analytics = {
    dashboard: function () {
      const result = request('GET', '/analytics/dashboard');
      return result.ok && result.data ? result.data : null;
    },
  };

  const users = {
    list: function () {
      const result = request('GET', '/users');
      return result.ok && result.data ? result.data : [];
    },
  };

  loadBootstrap();

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
  });

  return {
    ATTRACTIONS: ATTRACTIONS,
    TOURS: TOURS,
    auth: auth,
    bookings: bookings,
    reviews: reviews,
    attractions: attractions,
    tours: tours,
    analytics: analytics,
    users: users,
    routeForRole: routeForRole,
    refresh: loadBootstrap,
    getMultiplier: getMultiplier,
    starsHTML: starsHTML,
    imgFallback: imgFallback,
    initNav: initNav,
  };
})();

const TT = (function () {
  const API_BASE = '/api';
  const SESSION_KEY = 'tt_session';
  const TOKEN_KEY = 'tt_token';
  const LANG_KEY = 'tt_lang';
  const LANG_CACHE_KEY = 'tt_lang_cache_es';

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

    async simulatePayment(id, method) {
      const payload = await request('/bookings/' + id + '/simulate-payment', {
        method: 'PATCH',
        body: { method: method || 'Simulation Card' },
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

  const emergency = {
    async directory(district) {
      const params = new URLSearchParams();
      if (district) params.set('district', district);
      const suffix = params.toString() ? '?' + params.toString() : '';
      const payload = await request('/emergency/directory' + suffix, { auth: false });
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

  const textNodeSource = new WeakMap();
  const textNodeToken = new WeakMap();
  const attrNodeToken = new WeakMap();
  const asyncQueueToken = { value: 0 };
  const runtimeDictionary = {
    es: {},
  };
  const pendingMachineTranslations = {
    es: {},
  };

  const I18N = {
    en: {},
    es: {
      'Home': 'Inicio',
      'HOME': 'INICIO',
      'Attraction': 'Atraccion',
      'ATTRACTION': 'ATRACCION',
      'Book Tour': 'Reservar Tour',
      'BOOK TOUR': 'RESERVAR TOUR',
      'My Booking': 'Mis Reservas',
      'MYBOOKING': 'MIS RESERVAS',
      'My Bookings': 'Mis Reservas',
      'MY BOOKINGS:': 'MIS RESERVAS:',
      'Reviews': 'Resenas',
      'REVIEWS': 'RESENAS',
      'Dashboard': 'Panel',
      'DASHBOARD': 'PANEL',
      'Manage Tour': 'Gestionar Tour',
      'MANAGE TOUR': 'GESTIONAR TOUR',
      'Attractions': 'Atracciones',
      'ATTRACTIONS': 'ATRACCIONES',
      'Login': 'Iniciar Sesion',
      'LOGIN': 'INICIAR SESION',
      'Register': 'Registrarse',
      'REGISTER': 'REGISTRARSE',
      'Logout': 'Cerrar Sesion',
      'LOGOUT': 'CERRAR SESION',
      'Search': 'Buscar',
      'Search attractions...': 'Buscar atracciones...',
      'Search bookings...': 'Buscar reservas...',
      'Discover Belize': 'Descubre Belice',
      'DISCOVER BELIZE': 'DESCUBRE BELICE',
      'Explore pristine reefs, ancient Maya ruins, and lush rainforests. Book with the finest tour operators in the country.': 'Explora arrecifes pristinos, ruinas mayas ancestrales y selvas exuberantes. Reserva con los mejores operadores turisticos del pais.',
      'Top Attractions': 'Atracciones Principales',
      'TOP ATTRACTIONS': 'ATRACCIONES PRINCIPALES',
      'Popular Tours': 'Tours Populares',
      'POPULAR TOURS': 'TOURS POPULARES',
      'No attractions found.': 'No se encontraron atracciones.',
      'No tours available right now.': 'No hay tours disponibles en este momento.',
      'Tours': 'Tours',
      'TOURS': 'TOURS',
      'Filters': 'Filtros',
      'FILTERS': 'FILTROS',
      'Book Now': 'Reservar Ahora',
      'BOOK NOW': 'RESERVAR AHORA',
      'Booking': 'Reserva',
      'BOOKING': 'RESERVA',
      'Select your date:': 'Selecciona tu fecha:',
      'Select tour:': 'Seleccionar tour:',
      'SELECT TOUR:': 'SELECCIONAR TOUR:',
      'Choose a tour above': 'Elige un tour arriba',
      '-- Pick a tour --': '-- Selecciona un tour --',
      'Available': 'Disponible',
      'Unavailable': 'No Disponible',
      'Selected': 'Seleccionado',
      'Number of persons': 'Numero de personas',
      'NUMBER OF PERSONS': 'NUMERO DE PERSONAS',
      'Payment method': 'Metodo de pago',
      'PAYMENT METHOD': 'METODO DE PAGO',
      'Select a date': 'Selecciona una fecha',
      'SELECT A DATE': 'SELECCIONA UNA FECHA',
      'Select a date first': 'Selecciona una fecha primero',
      'SELECT A DATE FIRST': 'SELECCIONA UNA FECHA PRIMERO',
      'Per person price will adjust by season': 'El precio por persona se ajustara por temporada',
      'Price will show once you pick a tour + date': 'El precio aparecera cuando elijas tour y fecha',
      'Booking Confirmed!': 'Reserva Confirmada!',
      'BOOKING CONFIRMED!': 'RESERVA CONFIRMADA!',
      'A confirmation will appear in My Bookings.': 'Una confirmacion aparecera en Mis Reservas.',
      'View My Bookings': 'Ver Mis Reservas',
      'VIEW MY BOOKINGS': 'VER MIS RESERVAS',
      'Available Tours': 'Tours Disponibles',
      'AVAILABLE TOURS': 'TOURS DISPONIBLES',
      'More Tours': 'Mas Tours',
      'MORE TOURS': 'MAS TOURS',
      'Loading...': 'Cargando...',
      'No tours available yet for this attraction.': 'Aun no hay tours disponibles para esta atraccion.',
      'No reviews yet - be the first!': 'Aun no hay resenas - se el primero!',
      'No reviews yet.': 'Aun no hay resenas.',
      'Be the first!': 'Se el primero!',
      'See all': 'Ver todas',
      'Write a Review': 'Escribe una resena',
      'WRITE A REVIEW': 'ESCRIBE UNA RESENA',
      'Your rating': 'Tu calificacion',
      'YOUR RATING': 'TU CALIFICACION',
      'Write your review...': 'Escribe tu resena...',
      'WRITE YOUR REVIEW...': 'ESCRIBE TU RESENA...',
      'Submit Review': 'Enviar Resena',
      'SUBMIT REVIEW': 'ENVIAR RESENA',
      'Review submitted!': 'Resena enviada!',
      'All Tours': 'Todos los Tours',
      'ALL TOURS': 'TODOS LOS TOURS',
      'review': 'resena',
      'reviews': 'resenas',
      'Email': 'Correo',
      'Password': 'Contrasena',
      'Forgot password?': 'Olvidaste tu contrasena?',
      'FORGOT PASSWORD?': 'OLVIDASTE TU CONTRASENA?',
      'Go!': 'Entrar!',
      'GO!': 'ENTRAR!',
      'Continue with email': 'Continuar con correo',
      'CONTINUE WITH EMAIL': 'CONTINUAR CON CORREO',
      'Already have an account?': 'Ya tienes una cuenta?',
      'Login here': 'Inicia sesion aqui',
      'Who are you?': 'Quien eres?',
      'WHO ARE YOU?': 'QUIEN ERES?',
      'Select your account type': 'Selecciona tu tipo de cuenta',
      'SELECT YOUR ACCOUNT TYPE': 'SELECCIONA TU TIPO DE CUENTA',
      'Tourist': 'Turista',
      'TOURIST': 'TURISTA',
      'Operator': 'Operador',
      'OPERATOR': 'OPERADOR',
      'Admin': 'Administrador',
      'ADMIN': 'ADMINISTRADOR',
      'Browse attractions, book tours and leave reviews': 'Explora atracciones, reserva tours y deja resenas',
      'Create and manage tour packages for your attraction': 'Crea y administra paquetes turisticos para tu atraccion',
      'Full system control over attractions and users': 'Control total del sistema sobre atracciones y usuarios',
      'Back': 'Atras',
      'BACK': 'ATRAS',
      'Next': 'Siguiente',
      'NEXT': 'SIGUIENTE',
      'Create your account': 'Crea tu cuenta',
      'CREATE YOUR ACCOUNT': 'CREA TU CUENTA',
      'First name': 'Nombre',
      'FIRST NAME': 'NOMBRE',
      'Last name': 'Apellido',
      'LAST NAME': 'APELLIDO',
      'Confirm password': 'Confirmar contrasena',
      'CONFIRM PASSWORD': 'CONFIRMAR CONTRASENA',
      'Nationality': 'Nacionalidad',
      'NATIONALITY': 'NACIONALIDAD',
      'Select country...': 'Selecciona pais...',
      'Company name': 'Nombre de empresa',
      'COMPANY NAME': 'NOMBRE DE EMPRESA',
      'Contact phone': 'Telefono de contacto',
      'CONTACT PHONE': 'TELEFONO DE CONTACTO',
      'Business email': 'Correo empresarial',
      'BUSINESS EMAIL': 'CORREO EMPRESARIAL',
      'Create account': 'Crear cuenta',
      'CREATE ACCOUNT': 'CREAR CUENTA',
      "You're all set!": 'Todo listo!',
      "YOU'RE ALL SET!": 'TODO LISTO!',
      'Your account is ready. Start your adventure!': 'Tu cuenta esta lista. Comienza tu aventura!',
      "Let's go!": 'Vamos!',
      "LET'S GO!": 'VAMOS!',
      'Total users': 'Usuarios totales',
      'TOTAL USERS': 'USUARIOS TOTALES',
      'Total bookings': 'Reservas totales',
      'TOTAL BOOKINGS': 'RESERVAS TOTALES',
      'Most popular tours': 'Tours mas populares',
      'MOST POPULAR TOURS': 'TOURS MAS POPULARES',
      'No booking data yet.': 'Aun no hay datos de reservas.',
      'Admin Dashboard': 'Panel de Administrador',
      'ADMIN DASHBOARD': 'PANEL DE ADMINISTRADOR',
      'Create attraction': 'Crear atraccion',
      'CREATE ATTRACTION': 'CREAR ATRACCION',
      'Attraction name:': 'Nombre de atraccion:',
      'Attraction type:': 'Tipo de atraccion:',
      'Select type...': 'Selecciona tipo...',
      'Attraction price:': 'Precio de atraccion:',
      'Attraction description:': 'Descripcion de atraccion:',
      'Attraction created successfully!': 'Atraccion creada con exito!',
      'User manager': 'Administrador de usuarios',
      'USER MANAGER': 'ADMINISTRADOR DE USUARIOS',
      'Create/Edit Tour': 'Crear/Editar Tour',
      'CREATE/EDIT TOUR': 'CREAR/EDITAR TOUR',
      'Tour saved successfully!': 'Tour guardado con exito!',
      'Price:': 'Precio:',
      'Duration (hrs):': 'Duracion (hrs):',
      'Location:': 'Ubicacion:',
      'Linked Attraction:': 'Atraccion vinculada:',
      'Select attraction...': 'Selecciona atraccion...',
      'Tour Name:': 'Nombre del tour:',
      'Tour Description:': 'Descripcion del tour:',
      'Max Capacity:': 'Capacidad maxima:',
      'Upload Images': 'Subir imagenes',
      'Save Tour': 'Guardar Tour',
      'SAVE TOUR': 'GUARDAR TOUR',
      'Cancel': 'Cancelar',
      'CANCEL': 'CANCELAR',
      'Your Tours': 'Tus Tours',
      'YOUR TOURS': 'TUS TOURS',
      'Edit': 'Editar',
      'EDIT': 'EDITAR',
      'No tours created yet.': 'Aun no hay tours creados.',
      'Tour': 'Tour',
      'Date': 'Fecha',
      'Persons': 'Personas',
      'Total': 'Total',
      'Status': 'Estado',
      'Confirmed': 'Confirmada',
      'Cancelled': 'Cancelada',
      'Pending': 'Pendiente',
      'No bookings yet!': 'Aun no hay reservas!',
      'Book your first tour': 'Reserva tu primer tour',
      'Emergency': 'Emergencia',
      'EMERGENCY': 'EMERGENCIA',
      'Safety': 'Seguridad',
      'SAFETY': 'SEGURIDAD',
    },
  };

  function normalizeText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function translateString(text, lang) {
    if (!text || lang === 'en') return text;
    const dict = I18N[lang] || {};
    const exact = dict[text];
    if (exact) return exact;

    const normalized = normalizeText(text);
    if (dict[normalized]) {
      return text.replace(normalized, dict[normalized]);
    }

    var translated = text;
    Object.keys(dict)
      .sort(function (a, b) { return b.length - a.length; })
      .forEach(function (source) {
        if (!source || source.length < 4) return;
        var re = new RegExp(escapeRegex(source), 'g');
        translated = translated.replace(re, dict[source]);
      });
    return translated;
  }

  function loadRuntimeDictionary(lang) {
    if (lang !== 'es') return;
    if (Object.keys(runtimeDictionary.es).length) return;
    try {
      const raw = localStorage.getItem(LANG_CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        runtimeDictionary.es = parsed;
      }
    } catch (error) {
      runtimeDictionary.es = {};
    }
  }

  function persistRuntimeDictionary(lang) {
    if (lang !== 'es') return;
    try {
      localStorage.setItem(LANG_CACHE_KEY, JSON.stringify(runtimeDictionary.es));
    } catch (error) {
      // ignore quota/storage errors
    }
  }

  function dictionaryLookup(text, lang) {
    if (!text) return '';
    const dict = I18N[lang] || {};
    const dynamicDict = runtimeDictionary[lang] || {};
    return dict[text] || dynamicDict[text] || '';
  }

  function shouldAutoTranslate(source, lang) {
    if (lang !== 'es') return false;
    if (!source) return false;
    const cleaned = normalizeText(source);
    if (!cleaned) return false;
    if (cleaned.length < 2) return false;
    if (!/[A-Za-z]/.test(cleaned)) return false;
    if (/^[\d\s.,:/+$%()\-–—]+$/.test(cleaned)) return false;
    return true;
  }

  function fetchMachineTranslation(source, lang) {
    if (lang !== 'es') return Promise.resolve(source);
    if (!pendingMachineTranslations.es[source]) {
      const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=' + lang + '&dt=t&q=' + encodeURIComponent(source);
      pendingMachineTranslations.es[source] = fetch(url)
        .then(function (response) {
          if (!response.ok) throw new Error('translation request failed');
          return response.json();
        })
        .then(function (payload) {
          const parts = Array.isArray(payload && payload[0]) ? payload[0] : [];
          const translated = parts.map(function (piece) { return piece && piece[0] ? piece[0] : ''; }).join('').trim();
          if (!translated) throw new Error('translation empty');
          runtimeDictionary.es[source] = translated;
          persistRuntimeDictionary('es');
          return translated;
        })
        .catch(function () {
          return source;
        })
        .finally(function () {
          delete pendingMachineTranslations.es[source];
        });
    }
    return pendingMachineTranslations.es[source];
  }

  function queueTextTranslation(nodeRef, sourceText, lang, token) {
    fetchMachineTranslation(sourceText, lang).then(function (result) {
      if (currentLang() !== lang) return;
      if (textNodeToken.get(nodeRef) !== token) return;
      if (textNodeSource.get(nodeRef) !== sourceText) return;
      nodeRef.nodeValue = result;
    });
  }

  function queueAttrTranslation(elRef, attr, sourceText, lang, token) {
    fetchMachineTranslation(sourceText, lang).then(function (result) {
      if (currentLang() !== lang) return;
      var latest = attrNodeToken.get(elRef);
      if (!latest || latest[attr] !== token) return;
      if (originalAttr(elRef, attr) !== sourceText) return;
      if (attr === 'value') {
        elRef.value = result;
      } else {
        elRef.setAttribute(attr, result);
      }
    });
  }

  function currentLang() {
    loadRuntimeDictionary('es');
    var lang = localStorage.getItem(LANG_KEY);
    return lang === 'es' ? 'es' : 'en';
  }

  function setLang(lang) {
    var next = lang === 'es' ? 'es' : 'en';
    loadRuntimeDictionary(next);
    localStorage.setItem(LANG_KEY, next);
    document.documentElement.lang = next;
    applyTranslations(document.body, next);
  }

  function setOriginalAttr(el, attr, value) {
    var key = 'ttOrig' + attr.charAt(0).toUpperCase() + attr.slice(1);
    if (!Object.prototype.hasOwnProperty.call(el.dataset, key)) {
      el.dataset[key] = value;
    }
    return key;
  }

  function originalAttr(el, attr) {
    var key = 'ttOrig' + attr.charAt(0).toUpperCase() + attr.slice(1);
    return Object.prototype.hasOwnProperty.call(el.dataset, key) ? el.dataset[key] : null;
  }

  function translateElementText(root, lang) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        var tag = p.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE') return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    var node;
    while ((node = walker.nextNode())) {
      if (!textNodeSource.has(node)) {
        textNodeSource.set(node, node.nodeValue);
      }
      var source = textNodeSource.get(node);
      if (lang === 'en') {
        node.nodeValue = source;
        continue;
      }

      var staticTranslated = translateString(source, lang);
      var knownTranslated = dictionaryLookup(source, lang) || (staticTranslated !== source ? staticTranslated : '');
      if (knownTranslated) {
        node.nodeValue = knownTranslated;
        continue;
      }

      node.nodeValue = source;
      if (!shouldAutoTranslate(source, lang)) continue;

      var token = asyncQueueToken.value += 1;
      textNodeToken.set(node, token);
      queueTextTranslation(node, source, lang, token);
    }
  }

  function translateAttributes(root, lang) {
    var attrs = ['placeholder', 'title', 'aria-label'];
    var nodes = [root].concat(Array.prototype.slice.call(root.querySelectorAll('*')));
    nodes.forEach(function (el) {
      attrs.forEach(function (attr) {
        if (!el.hasAttribute || !el.hasAttribute(attr)) return;
        var current = el.getAttribute(attr);
        var source = originalAttr(el, attr);
        if (source == null) {
          setOriginalAttr(el, attr, current);
          source = current;
        }
        if (lang === 'en') {
          el.setAttribute(attr, source);
          return;
        }

        var staticTranslated = translateString(source, lang);
        var knownTranslated = dictionaryLookup(source, lang) || (staticTranslated !== source ? staticTranslated : '');
        if (knownTranslated) {
          el.setAttribute(attr, knownTranslated);
          return;
        }

        el.setAttribute(attr, source);
        if (!shouldAutoTranslate(source, lang)) return;

        var attrToken = asyncQueueToken.value += 1;
        if (!attrNodeToken.has(el)) attrNodeToken.set(el, {});
        var attrTokens = attrNodeToken.get(el);
        attrTokens[attr] = attrToken;
        queueAttrTranslation(el, attr, source, lang, attrToken);
      });

      if (el.tagName === 'INPUT' && /^(button|submit)$/i.test(el.type || '') && el.value) {
        var valueSource = originalAttr(el, 'value');
        if (valueSource == null) {
          setOriginalAttr(el, 'value', el.value);
          valueSource = el.value;
        }
        if (lang === 'en') {
          el.value = valueSource;
        } else {
          var staticValue = translateString(valueSource, lang);
          var knownValue = dictionaryLookup(valueSource, lang) || (staticValue !== valueSource ? staticValue : '');
          if (knownValue) {
            el.value = knownValue;
          } else if (shouldAutoTranslate(valueSource, lang)) {
            el.value = valueSource;
            var valueToken = asyncQueueToken.value += 1;
            if (!attrNodeToken.has(el)) attrNodeToken.set(el, {});
            var valueTokens = attrNodeToken.get(el);
            valueTokens.value = valueToken;
            queueAttrTranslation(el, 'value', valueSource, lang, valueToken);
          } else {
            el.value = valueSource;
          }
        }
      }
    });
  }

  function applyTranslations(root, lang) {
    if (!root) return;
    translateElementText(root, lang);
    translateAttributes(root, lang);
  }

  function addLanguageSwitcher() {
    if (document.getElementById('ttLangSwitch')) return;
    var wrap = document.createElement('div');
    wrap.id = 'ttLangSwitch';
    wrap.style.position = 'fixed';
    wrap.style.right = '16px';
    wrap.style.bottom = '16px';
    wrap.style.zIndex = '9999';
    wrap.style.background = 'rgba(13,51,32,0.92)';
    wrap.style.color = '#ffff00';
    wrap.style.border = '2px solid #fbc02d';
    wrap.style.borderRadius = '12px';
    wrap.style.padding = '8px 10px';
    wrap.style.fontFamily = 'Arial, sans-serif';
    wrap.style.fontSize = '12px';
    wrap.style.boxShadow = '0 4px 10px rgba(0,0,0,0.35)';
    wrap.innerHTML =
      '<label for="ttLangSelect" style="margin-right:8px;">Language</label>' +
      '<select id="ttLangSelect" style="border-radius:8px;padding:4px 6px;border:1px solid #fbc02d;background:#1a4d2e;color:#ffff00;">' +
      '<option value="en">English</option>' +
      '<option value="es">Espanol</option>' +
      '</select>';
    document.body.appendChild(wrap);
    var select = document.getElementById('ttLangSelect');
    select.value = currentLang();
    select.addEventListener('change', function (event) {
      setLang(event.target.value);
    });
  }

  function initI18n() {
    var lang = currentLang();
    addLanguageSwitcher();
    setLang(lang);

    var observer = new MutationObserver(function (changes) {
      if (currentLang() === 'en') return;
      changes.forEach(function (change) {
        change.addedNodes.forEach(function (node) {
          if (node.nodeType === Node.ELEMENT_NODE) applyTranslations(node, 'es');
          if (node.nodeType === Node.TEXT_NODE && node.parentElement) applyTranslations(node.parentElement, 'es');
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  return {
    ATTRACTIONS: ATTRACTIONS,
    TOURS: TOURS,
    analytics: analytics,
    attractions: attractions,
    auth: auth,
    bookings: bookings,
    catalog: catalog,
    emergency: emergency,
    getMultiplier: getMultiplier,
    imgFallback: imgFallback,
    i18n: {
      apply: function () { applyTranslations(document.body, currentLang()); },
      init: initI18n,
      language: currentLang,
      setLanguage: setLang,
      t: function (text) { return translateString(text, currentLang()); },
    },
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
  TT.i18n.init();
});

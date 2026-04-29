const router = require('express').Router();

// Note: This is a lightweight integration layer meant to be safe-by-default.
// It provides a curated directory + "tap to call" links. If/when official APIs
// become available, this route can be extended without changing the frontend.

const DISTRICTS = ['Belize', 'Cayo', 'Corozal', 'Orange Walk', 'Stann Creek', 'Toledo'];

function toDistrict(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const match = DISTRICTS.find((d) => d.toLowerCase() === raw.toLowerCase());
  return match || null;
}

function normalizePhone(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  return raw.replace(/\s+/g, ' ');
}

function telLink(phone) {
  const cleaned = String(phone || '').replace(/[^\d+]/g, '');
  if (!cleaned) return null;
  return 'tel:' + cleaned;
}

const directory = {
  // Canonical nationwide emergency number in Belize.
  // We intentionally avoid guessing local station / hospital numbers.
  hotlines: [
    {
      id: 'belize-911',
      name: 'Emergency Hotline (Police / Fire / Medical)',
      phone: '911',
      tel: 'tel:911',
      scope: 'Nationwide',
      category: 'emergency',
    },
  ],
  agencies: [
    {
      id: 'bpd',
      name: 'Belize Police Department',
      description: 'Law enforcement assistance and incident reporting.',
      scope: 'Nationwide',
      category: 'police',
      phone: process.env.TT_BPD_PHONE || null,
      tel: null,
      website: process.env.TT_BPD_WEBSITE || null,
    },
    {
      id: 'tourist-police',
      name: 'Tourist Police Unit',
      description: 'Visitor-focused assistance in tourist areas and major hubs.',
      scope: 'Nationwide',
      category: 'tourist_police',
      phone: process.env.TT_TOURIST_POLICE_PHONE || null,
      tel: null,
      website: process.env.TT_TOURIST_POLICE_WEBSITE || null,
    },
  ],
  medicalFacilities: [
    { id: 'karl-heusner', name: 'Karl Heusner Memorial Hospital', district: 'Belize', type: 'Hospital', phone: null, tel: null },
    { id: 'western-regional', name: 'Western Regional Hospital', district: 'Cayo', type: 'Hospital', phone: null, tel: null },
    { id: 'northern-regional', name: 'Northern Regional Hospital', district: 'Orange Walk', type: 'Hospital', phone: null, tel: null },
    { id: 'corozal-hospital', name: 'Corozal Community Hospital', district: 'Corozal', type: 'Hospital', phone: null, tel: null },
    { id: 'southern-regional', name: 'Southern Regional Hospital', district: 'Stann Creek', type: 'Hospital', phone: null, tel: null },
    { id: 'punta-gorda-hospital', name: 'Punta Gorda Hospital', district: 'Toledo', type: 'Hospital', phone: null, tel: null },
  ],
};

router.get('/directory', async (req, res) => {
  const district = toDistrict(req.query.district);

  const response = {
    districts: DISTRICTS.slice(),
    hotlines: directory.hotlines.map((row) => ({
      ...row,
      phone: normalizePhone(row.phone),
      tel: row.tel || telLink(row.phone),
    })),
    agencies: directory.agencies.map((row) => ({
      ...row,
      phone: normalizePhone(row.phone),
      tel: row.tel || telLink(row.phone),
    })),
    medicalFacilities: (district
      ? directory.medicalFacilities.filter((row) => row.district === district)
      : directory.medicalFacilities
    ).map((row) => ({
      ...row,
      phone: normalizePhone(row.phone),
      tel: row.tel || telLink(row.phone),
    })),
    disclaimer:
      'In an emergency, call 911. The directory is provided for visitor convenience; verify details locally when possible.',
    selectedDistrict: district,
  };

  res.json(response);
});

module.exports = router;

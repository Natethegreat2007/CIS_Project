const fs = require('fs/promises');
const path = require('path');
const argon2 = require('argon2');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

let store = null;

function nextId(items) {
  return items.reduce((maxId, item) => Math.max(maxId, item.id || 0), 0) + 1;
}

function nowIso() {
  return new Date().toISOString();
}

async function buildSeedStore() {
  const createdAt = nowIso();
  const passwordHashAdmin = await argon2.hash('admin123');
  const passwordHashOperator = await argon2.hash('operator123');
  const passwordHashTourist = await argon2.hash('tourist123');

  return {
    users: [
      {
        id: 1,
        email: 'admin@touristtome.bz',
        passwordHash: passwordHashAdmin,
        firstName: 'Nathan',
        lastName: 'Scott',
        role: 'admin',
        nationality: 'Belize',
        active: true,
        createdAt,
        updatedAt: createdAt,
        operatorId: null,
      },
      {
        id: 2,
        email: 'operator@touristtome.bz',
        passwordHash: passwordHashOperator,
        firstName: 'Nicole',
        lastName: 'Burke',
        role: 'operator',
        nationality: 'Belize',
        active: true,
        createdAt,
        updatedAt: createdAt,
        operatorId: 1,
      },
      {
        id: 3,
        email: 'tourist@touristtome.bz',
        passwordHash: passwordHashTourist,
        firstName: 'Gavin',
        lastName: 'Harban',
        role: 'tourist',
        nationality: 'United States',
        active: true,
        createdAt,
        updatedAt: createdAt,
        operatorId: null,
      },
    ],
    operators: [
      {
        id: 1,
        userId: 2,
        companyName: 'Belize Pro Divers',
        contactEmail: 'operator@touristtome.bz',
        phoneNum: '+501 610-1001',
      },
      {
        id: 2,
        userId: null,
        companyName: 'Sky Belize Aviation',
        contactEmail: 'bookings@skybelize.bz',
        phoneNum: '+501 610-1002',
      },
      {
        id: 3,
        userId: null,
        companyName: 'Reef Runners',
        contactEmail: 'hello@reefrunners.bz',
        phoneNum: '+501 610-1003',
      },
      {
        id: 4,
        userId: null,
        companyName: 'Cayo Adventures',
        contactEmail: 'guide@cayoadventures.bz',
        phoneNum: '+501 610-1004',
      },
      {
        id: 5,
        userId: null,
        companyName: 'Cockscomb Eco Tours',
        contactEmail: 'eco@cockscomb.bz',
        phoneNum: '+501 610-1005',
      },
      {
        id: 6,
        userId: null,
        companyName: 'Orange Walk Tours',
        contactEmail: 'rides@orangewalktours.bz',
        phoneNum: '+501 610-1006',
      },
    ],
    attractions: [
      {
        id: 1,
        title: 'The Great Blue Hole',
        category: 'Marine',
        location: 'Lighthouse Reef',
        basePrice: 50,
        seedRating: 4.3,
        image: '/images/bluehole.jpg',
        description: 'A world-famous marine sinkhole, 300m across and 125m deep. One of the top dive sites on Earth.',
        color: '#1565c0',
      },
      {
        id: 2,
        title: 'Xunantunich',
        category: 'Archaeological',
        location: 'Cayo District',
        basePrice: 20,
        seedRating: 4.7,
        image: '/images/ruins.jpg',
        description: 'Iconic Maya archaeological site featuring the towering El Castillo pyramid overlooking the Mopan River.',
        color: '#6d4c41',
      },
      {
        id: 3,
        title: 'Belize Barrier Reef',
        category: 'Marine',
        location: 'Caribbean Sea',
        basePrice: 35,
        seedRating: 4.8,
        image: '/images/reef.jpg',
        description: 'The second-largest coral reef system in the world and a UNESCO World Heritage Site.',
        color: '#00838f',
      },
      {
        id: 4,
        title: 'Caracol',
        category: 'Archaeological',
        location: 'Chiquibul Forest',
        basePrice: 15,
        seedRating: 4.5,
        image: '/images/caracol.jpg',
        description: 'The largest Maya archaeological site in Belize, deep in the Chiquibul Forest Reserve.',
        color: '#558b2f',
      },
      {
        id: 5,
        title: 'Cockscomb Basin',
        category: 'Wildlife',
        location: 'Stann Creek District',
        basePrice: 10,
        seedRating: 4.6,
        image: '/images/Cockscomb.jpg',
        description: "World's first jaguar sanctuary. Home to over 300 bird species and diverse Belizean wildlife.",
        color: '#2e7d32',
      },
      {
        id: 6,
        title: 'Lamanai',
        category: 'Archaeological',
        location: 'Orange Walk District',
        basePrice: 20,
        seedRating: 4.4,
        image: '/images/Lamanai.jpg',
        description: 'Ancient Maya temple complex accessible only by a scenic river boat safari through the jungle.',
        color: '#4e342e',
      },
    ],
    tours: [
      {
        id: 1,
        attrID: 1,
        operatorID: 1,
        title: 'Blue Hole Dive Adventure',
        description: 'Full-day scuba diving expedition into the iconic Blue Hole. Equipment, guide and lunch included.',
        durationHours: 6,
        price: 250,
        maxCap: 12,
        image: '/images/tour1.jpg',
        color: '#1565c0',
        location: 'Lighthouse Reef',
      },
      {
        id: 2,
        attrID: 1,
        operatorID: 2,
        title: 'Aerial Blue Hole Tour',
        description: 'Breathtaking sightseeing flight over the Blue Hole and Lighthouse Reef atolls.',
        durationHours: 2,
        price: 180,
        maxCap: 5,
        image: '/images/tour2.jpg',
        color: '#0288d1',
        location: 'Lighthouse Reef',
      },
      {
        id: 3,
        attrID: 3,
        operatorID: 3,
        title: 'Snorkeling Combo',
        description: 'Snorkeling at the Blue Hole perimeter and world-famous barrier reef.',
        durationHours: 4,
        price: 120,
        maxCap: 20,
        image: '/images/tour3.jpg',
        color: '#00838f',
        location: 'Caribbean Sea',
      },
      {
        id: 4,
        attrID: 2,
        operatorID: 4,
        title: 'Exploring Maya Ruins',
        description: 'Guided walk through Xunantunich with a certified archaeologist. Transport included.',
        durationHours: 5,
        price: 75,
        maxCap: 15,
        image: '/images/tour4.jpg',
        color: '#6d4c41',
        location: 'Cayo District',
      },
      {
        id: 5,
        attrID: 5,
        operatorID: 5,
        title: 'Jaguar Sanctuary Trek',
        description: "Guided hike through the world's first jaguar sanctuary. Spot wildlife and native birds.",
        durationHours: 4,
        price: 65,
        maxCap: 10,
        image: '/images/tour5.jpg',
        color: '#2e7d32',
        location: 'Stann Creek District',
      },
      {
        id: 6,
        attrID: 6,
        operatorID: 6,
        title: 'Lamanai River Safari',
        description: 'Scenic boat ride through the jungle to the ancient Lamanai temple complex.',
        durationHours: 6,
        price: 85,
        maxCap: 14,
        image: '/images/tour6.jpg',
        color: '#4e342e',
        location: 'Orange Walk District',
      },
    ],
    bookings: [
      {
        id: 1,
        userID: 3,
        tourID: 1,
        tourDate: '2026-05-06',
        personCount: 2,
        paymentMethod: 'Visa',
        totalPrice: 500,
        season: 'Standard',
        status: 'Confirmed',
        bookedAt: '2026-04-01T10:00:00.000Z',
      },
      {
        id: 2,
        userID: 3,
        tourID: 4,
        tourDate: '2026-05-18',
        personCount: 4,
        paymentMethod: 'Mastercard',
        totalPrice: 300,
        season: 'Standard',
        status: 'Confirmed',
        bookedAt: '2026-04-03T13:30:00.000Z',
      },
      {
        id: 3,
        userID: 3,
        tourID: 5,
        tourDate: '2026-06-10',
        personCount: 3,
        paymentMethod: 'PayPal',
        totalPrice: 165.75,
        season: 'Off-Peak',
        status: 'Pending',
        bookedAt: '2026-04-08T09:15:00.000Z',
      },
    ],
    reviews: [
      {
        id: 1,
        tourID: 1,
        userID: null,
        userName: 'BARRETTSHO67',
        rating: 1,
        comment: 'I ruined my trip.',
        createdAt: '2026-02-01T00:00:00.000Z',
      },
      {
        id: 2,
        tourID: 1,
        userID: null,
        userName: 'SOFIA DE PAZ',
        rating: 2,
        comment: 'The trip was bad.',
        createdAt: '2026-02-03T00:00:00.000Z',
      },
      {
        id: 3,
        tourID: 1,
        userID: null,
        userName: 'EDWARDO COCOM',
        rating: 5,
        comment: 'No chihuahua in sight!!!',
        createdAt: '2026-02-10T00:00:00.000Z',
      },
      {
        id: 4,
        tourID: 4,
        userID: null,
        userName: 'ANDREW CABLE',
        rating: 5,
        comment: 'Best day of my vacation!',
        createdAt: '2026-02-14T00:00:00.000Z',
      },
      {
        id: 5,
        tourID: 5,
        userID: null,
        userName: 'HILARY ROBERT',
        rating: 3,
        comment: 'Nice but a bit cramped.',
        createdAt: '2026-02-18T00:00:00.000Z',
      },
      {
        id: 6,
        tourID: 3,
        userID: null,
        userName: 'STACY SUTHERLAND',
        rating: 4,
        comment: 'Incredible reef colours.',
        createdAt: '2026-02-22T00:00:00.000Z',
      },
    ],
  };
}

async function writeStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2));
}

async function initializeStore() {
  if (store) {
    return store;
  }

  try {
    const file = await fs.readFile(DATA_FILE, 'utf8');
    store = JSON.parse(file);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }

    store = await buildSeedStore();
    await writeStore();
  }

  return store;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function readData() {
  await initializeStore();
  return clone(store);
}

async function updateData(mutator) {
  await initializeStore();
  const result = await mutator(store, { nextId, nowIso });
  await writeStore();
  return result;
}

module.exports = {
  initializeStore,
  readData,
  updateData,
  nextId,
  nowIso,
};

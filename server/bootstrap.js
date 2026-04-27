const argon2 = require('argon2');
const mysql = require('mysql2/promise');
const { dbConfig, pool } = require('./db');
const { ensureAvailabilityForRange, toIsoDateString } = require('./lib/availability');

const demoUsers = [
  {
    email: 'admin@touristtome.bz',
    password: 'admin123',
    firstName: 'Nathan',
    lastName: 'Scott',
    role: 'Admin',
    nationality: 'Belize',
  },
  {
    email: 'operator@touristtome.bz',
    password: 'operator123',
    firstName: 'Nicole',
    lastName: 'Burke',
    role: 'Operator',
    nationality: 'Belize',
    operator: {
      companyName: 'Belize Pro Divers',
      contactEmail: 'operator@touristtome.bz',
      phoneNum: '+501 600-1000',
    },
  },
  {
    email: 'tourist@touristtome.bz',
    password: 'tourist123',
    firstName: 'Gavin',
    lastName: 'Harban',
    role: 'Tourist',
    nationality: 'United States',
  },
];

const seedOperators = [
  { companyName: 'Belize Pro Divers', contactEmail: 'hello@belizeprodivers.bz', phoneNum: '+501 600-1000' },
  { companyName: 'Sky Belize Aviation', contactEmail: 'ops@skybelize.bz', phoneNum: '+501 600-1001' },
  { companyName: 'Reef Runners', contactEmail: 'bookings@reefrunners.bz', phoneNum: '+501 600-1002' },
  { companyName: 'Cayo Adventures', contactEmail: 'explore@cayoadventures.bz', phoneNum: '+501 600-1003' },
  { companyName: 'Cockscomb Eco Tours', contactEmail: 'trails@cockscombecotours.bz', phoneNum: '+501 600-1004' },
  { companyName: 'Orange Walk Tours', contactEmail: 'info@orangewalktours.bz', phoneNum: '+501 600-1005' },
];

const seedAttractions = [
  {
    title: 'The Great Blue Hole',
    category: 'Marine',
    location: 'Lighthouse Reef',
    price: 50,
    description: 'A world-famous marine sinkhole, 300m across and 125m deep. One of the top dive sites on Earth.',
    imagePath: '/images/bluehole.jpg',
  },
  {
    title: 'Xunantunich',
    category: 'Archaeological',
    location: 'Cayo District',
    price: 20,
    description: 'Iconic Maya archaeological site featuring the towering El Castillo pyramid overlooking the Mopan River.',
    imagePath: '/images/ruins.jpg',
  },
  {
    title: 'Belize Barrier Reef',
    category: 'Marine',
    location: 'Caribbean Sea',
    price: 35,
    description: 'The second-largest coral reef system in the world and a UNESCO World Heritage Site.',
    imagePath: '/images/reef.jpg',
  },
  {
    title: 'Caracol',
    category: 'Archaeological',
    location: 'Chiquibul Forest',
    price: 15,
    description: 'The largest Maya archaeological site in Belize, deep in the Chiquibul Forest Reserve.',
    imagePath: '/images/caracol.jpg',
  },
  {
    title: 'Cockscomb Basin',
    category: 'Wildlife',
    location: 'Stann Creek District',
    price: 10,
    description: "World's first jaguar sanctuary. Home to over 300 bird species and diverse Belizean wildlife.",
    imagePath: '/images/Cockscomb.jpg',
  },
  {
    title: 'Lamanai',
    category: 'Archaeological',
    location: 'Orange Walk District',
    price: 20,
    description: 'Ancient Maya temple complex accessible only by a scenic river boat safari through the jungle.',
    imagePath: '/images/Lamanai.jpg',
  },
];

const seedTours = [
  {
    title: 'Blue Hole Dive Adventure',
    attraction: 'The Great Blue Hole',
    operator: 'Belize Pro Divers',
    duration: 6,
    price: 250,
    maxCap: 12,
    description: 'Full-day scuba diving expedition into the iconic Blue Hole. Equipment, guide and lunch included.',
    location: 'Lighthouse Reef',
    imagePath: '/images/tour1.jpg',
  },
  {
    title: 'Aerial Blue Hole Tour',
    attraction: 'The Great Blue Hole',
    operator: 'Sky Belize Aviation',
    duration: 2,
    price: 180,
    maxCap: 5,
    description: 'Breathtaking sightseeing flight over the Blue Hole and Lighthouse Reef atolls.',
    location: 'Lighthouse Reef',
    imagePath: '/images/tour2.jpg',
  },
  {
    title: 'Snorkeling Combo',
    attraction: 'Belize Barrier Reef',
    operator: 'Reef Runners',
    duration: 4,
    price: 120,
    maxCap: 20,
    description: 'Snorkeling at the Blue Hole perimeter and world-famous barrier reef.',
    location: 'Caribbean Sea',
    imagePath: '/images/tour3.jpg',
  },
  {
    title: 'Exploring Maya Ruins',
    attraction: 'Xunantunich',
    operator: 'Cayo Adventures',
    duration: 5,
    price: 75,
    maxCap: 15,
    description: 'Guided walk through Xunantunich with a certified archaeologist. Transport included.',
    location: 'Cayo District',
    imagePath: '/images/tour4.jpg',
  },
  {
    title: 'Jaguar Sanctuary Trek',
    attraction: 'Cockscomb Basin',
    operator: 'Cockscomb Eco Tours',
    duration: 4,
    price: 65,
    maxCap: 10,
    description: "Guided hike through the world's first jaguar sanctuary. Spot wildlife and native birds.",
    location: 'Stann Creek District',
    imagePath: '/images/tour5.jpg',
  },
  {
    title: 'Lamanai River Safari',
    attraction: 'Lamanai',
    operator: 'Orange Walk Tours',
    duration: 6,
    price: 85,
    maxCap: 14,
    description: 'Scenic boat ride through the jungle to the ancient Lamanai temple complex.',
    location: 'Orange Walk District',
    imagePath: '/images/tour6.jpg',
  },
];

const seedReviewers = [
  { firstName: 'Barrett', lastName: 'Sho', email: 'barrettsho67@example.com' },
  { firstName: 'Sofia', lastName: 'De Paz', email: 'sofia.depaz@example.com' },
  { firstName: 'Eduardo', lastName: 'Cocom', email: 'eduardo.cocom@example.com' },
  { firstName: 'Andrew', lastName: 'Cable', email: 'andrew.cable@example.com' },
  { firstName: 'Hilary', lastName: 'Robert', email: 'hilary.robert@example.com' },
  { firstName: 'Stacy', lastName: 'Sutherland', email: 'stacy.sutherland@example.com' },
];

const seedReviews = [
  { reviewer: 'barrettsho67@example.com', tour: 'Blue Hole Dive Adventure', rating: 1, comment: 'I ruined my trip.', date: '2026-02-01 12:00:00' },
  { reviewer: 'sofia.depaz@example.com', tour: 'Blue Hole Dive Adventure', rating: 2, comment: 'The trip was bad.', date: '2026-02-03 12:00:00' },
  { reviewer: 'eduardo.cocom@example.com', tour: 'Blue Hole Dive Adventure', rating: 5, comment: 'No chihuahua in sight!!!', date: '2026-02-10 12:00:00' },
  { reviewer: 'andrew.cable@example.com', tour: 'Exploring Maya Ruins', rating: 5, comment: 'Best day of my vacation!', date: '2026-02-14 12:00:00' },
  { reviewer: 'hilary.robert@example.com', tour: 'Jaguar Sanctuary Trek', rating: 3, comment: 'Nice but a bit cramped.', date: '2026-02-18 12:00:00' },
  { reviewer: 'stacy.sutherland@example.com', tour: 'Snorkeling Combo', rating: 4, comment: 'Incredible reef colours.', date: '2026-02-22 12:00:00' },
];

async function createDatabaseIfNeeded() {
  const adminConfig = { ...dbConfig };
  delete adminConfig.database;

  const connection = await mysql.createConnection(adminConfig);
  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await connection.end();
  }
}

async function createTables(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS Role (
      roleID INT AUTO_INCREMENT PRIMARY KEY,
      roleName VARCHAR(100) NOT NULL UNIQUE
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS Nationality (
      natID INT AUTO_INCREMENT PRIMARY KEY,
      cName VARCHAR(100) NOT NULL UNIQUE,
      iso CHAR(3) UNIQUE
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS Users (
      userID INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      passwordHash VARCHAR(255) NOT NULL,
      fName VARCHAR(50) NOT NULL,
      lName VARCHAR(50) NOT NULL,
      roleID INT NOT NULL,
      natID INT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      FOREIGN KEY (roleID) REFERENCES Role(roleID),
      FOREIGN KEY (natID) REFERENCES Nationality(natID)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS AttrCategory (
      catID INT AUTO_INCREMENT PRIMARY KEY,
      catName VARCHAR(100) NOT NULL UNIQUE
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS Attraction (
      attrID INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL UNIQUE,
      descr TEXT NOT NULL,
      catID INT NOT NULL,
      location VARCHAR(255) NOT NULL,
      basePrice DECIMAL(10, 2) NOT NULL,
      FOREIGN KEY (catID) REFERENCES AttrCategory(catID)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS AttrMedia (
      mediaID INT AUTO_INCREMENT PRIMARY KEY,
      attrID INT NOT NULL,
      mediaPath LONGTEXT NOT NULL,
      mediaType VARCHAR(50) NOT NULL,
      displayOrder INT NOT NULL DEFAULT 0,
      alt VARCHAR(255) NULL,
      uploadedTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (attrID) REFERENCES Attraction(attrID) ON DELETE CASCADE,
      UNIQUE KEY uq_attrmedia_order (attrID, displayOrder)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS Operator (
      operatorID INT AUTO_INCREMENT PRIMARY KEY,
      userID INT NULL UNIQUE,
      companyName VARCHAR(255) NOT NULL UNIQUE,
      contactEmail VARCHAR(255) NOT NULL,
      phoneNum VARCHAR(50) NULL,
      FOREIGN KEY (userID) REFERENCES Users(userID) ON DELETE SET NULL
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS Tour (
      tourID INT AUTO_INCREMENT PRIMARY KEY,
      attrID INT NOT NULL,
      operatorID INT NOT NULL,
      title VARCHAR(255) NOT NULL UNIQUE,
      descr TEXT NOT NULL,
      duration INT NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      maxCap INT NOT NULL,
      location VARCHAR(255) NULL,
      imagePath LONGTEXT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (attrID) REFERENCES Attraction(attrID),
      FOREIGN KEY (operatorID) REFERENCES Operator(operatorID)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS Availability (
      availabilityID INT AUTO_INCREMENT PRIMARY KEY,
      tourID INT NOT NULL,
      date DATE NOT NULL,
      slots INT NOT NULL,
      UNIQUE KEY uq_availability_tour_date (tourID, date),
      FOREIGN KEY (tourID) REFERENCES Tour(tourID) ON DELETE CASCADE
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS Booking (
      bookingID INT AUTO_INCREMENT PRIMARY KEY,
      userID INT NOT NULL,
      tourID INT NOT NULL,
      tourDate DATE NOT NULL,
      bookingDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      personCount INT NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      seasonLabel VARCHAR(50) NOT NULL DEFAULT 'Standard',
      status VARCHAR(50) NOT NULL,
      FOREIGN KEY (userID) REFERENCES Users(userID),
      FOREIGN KEY (tourID) REFERENCES Tour(tourID)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS Payment (
      paymentID INT AUTO_INCREMENT PRIMARY KEY,
      bookingID INT NOT NULL UNIQUE,
      amount DECIMAL(10, 2) NOT NULL,
      method VARCHAR(50) NOT NULL,
      success BOOLEAN NOT NULL,
      date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bookingID) REFERENCES Booking(bookingID) ON DELETE CASCADE
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS Review (
      reviewID INT AUTO_INCREMENT PRIMARY KEY,
      userID INT NOT NULL,
      tourID INT NOT NULL,
      rating DECIMAL(2, 1) NOT NULL,
      comment TEXT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_review_user_tour (userID, tourID),
      FOREIGN KEY (userID) REFERENCES Users(userID) ON DELETE CASCADE,
      FOREIGN KEY (tourID) REFERENCES Tour(tourID) ON DELETE CASCADE
    )
  `);
}

async function getRoleId(connection, roleName) {
  const [rows] = await connection.query('SELECT roleID FROM Role WHERE roleName = ? LIMIT 1', [roleName]);
  return rows[0]?.roleID || null;
}

async function getNationalityId(connection, countryName) {
  if (!countryName) {
    return null;
  }

  await connection.query(
    `
      INSERT INTO Nationality (cName)
      VALUES (?)
      ON DUPLICATE KEY UPDATE cName = VALUES(cName)
    `,
    [countryName]
  );

  const [rows] = await connection.query('SELECT natID FROM Nationality WHERE cName = ? LIMIT 1', [countryName]);
  return rows[0]?.natID || null;
}

async function ensureUser(connection, user) {
  const existing = await connection.query('SELECT userID FROM Users WHERE email = ? LIMIT 1', [user.email]);
  if (existing[0][0]) {
    return existing[0][0].userID;
  }

  const roleId = await getRoleId(connection, user.role);
  const natId = await getNationalityId(connection, user.nationality);
  const passwordHash = await argon2.hash(user.password);

  const [result] = await connection.query(
    `
      INSERT INTO Users (email, passwordHash, fName, lName, roleID, natID)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [user.email, passwordHash, user.firstName, user.lastName, roleId, natId]
  );

  return result.insertId;
}

async function seedReferenceData(connection) {
  await connection.query(`
    INSERT INTO Role (roleID, roleName)
    VALUES (1, 'Admin'), (2, 'Operator'), (3, 'Tourist')
    ON DUPLICATE KEY UPDATE roleName = VALUES(roleName)
  `);

  await connection.query(`
    INSERT INTO AttrCategory (catID, catName)
    VALUES
      (1, 'Archaeological'),
      (2, 'Marine'),
      (3, 'Wildlife'),
      (4, 'Cultural')
    ON DUPLICATE KEY UPDATE catName = VALUES(catName)
  `);

  const countries = ['Belize', 'United States', 'United Kingdom', 'Canada', 'Mexico', 'Guatemala', 'Jamaica', 'Trinidad and Tobago'];
  for (const country of countries) {
    await getNationalityId(connection, country);
  }
}

async function seedUsers(connection) {
  const userIds = {};

  for (const user of demoUsers) {
    userIds[user.email] = await ensureUser(connection, user);
  }

  for (const reviewer of seedReviewers) {
    userIds[reviewer.email] = await ensureUser(connection, {
      ...reviewer,
      password: 'tourist123',
      role: 'Tourist',
      nationality: 'United States',
    });
  }

  return userIds;
}

async function seedOperatorsTable(connection, userIds) {
  for (const operator of seedOperators) {
    const linkedUserId =
      operator.companyName === 'Belize Pro Divers'
        ? userIds['operator@touristtome.bz']
        : null;

    await connection.query(
      `
        INSERT INTO Operator (userID, companyName, contactEmail, phoneNum)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          userID = COALESCE(VALUES(userID), userID),
          contactEmail = VALUES(contactEmail),
          phoneNum = VALUES(phoneNum)
      `,
      [linkedUserId, operator.companyName, operator.contactEmail, operator.phoneNum]
    );
  }
}

async function seedAttractionsTable(connection) {
  for (const attraction of seedAttractions) {
    const [catRows] = await connection.query(
      'SELECT catID FROM AttrCategory WHERE catName = ? LIMIT 1',
      [attraction.category]
    );

    const catId = catRows[0].catID;

    await connection.query(
      `
        INSERT INTO Attraction (title, descr, catID, location, basePrice)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          descr = VALUES(descr),
          catID = VALUES(catID),
          location = VALUES(location),
          basePrice = VALUES(basePrice)
      `,
      [attraction.title, attraction.description, catId, attraction.location, attraction.price]
    );

    const [attrRows] = await connection.query(
      'SELECT attrID FROM Attraction WHERE title = ? LIMIT 1',
      [attraction.title]
    );

    const attrId = attrRows[0].attrID;
    await connection.query(
      `
        INSERT INTO AttrMedia (attrID, mediaPath, mediaType, displayOrder, alt)
        VALUES (?, ?, 'image', 0, ?)
        ON DUPLICATE KEY UPDATE
          mediaPath = VALUES(mediaPath),
          alt = VALUES(alt)
      `,
      [attrId, attraction.imagePath, attraction.title]
    );
  }
}

async function seedToursTable(connection) {
  for (const tour of seedTours) {
    const [attrRows] = await connection.query(
      'SELECT attrID FROM Attraction WHERE title = ? LIMIT 1',
      [tour.attraction]
    );
    const [operatorRows] = await connection.query(
      'SELECT operatorID FROM Operator WHERE companyName = ? LIMIT 1',
      [tour.operator]
    );

    const attrId = attrRows[0].attrID;
    const operatorId = operatorRows[0].operatorID;

    await connection.query(
      `
        INSERT INTO Tour (attrID, operatorID, title, descr, duration, price, maxCap, location, imagePath)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          attrID = VALUES(attrID),
          operatorID = VALUES(operatorID),
          descr = VALUES(descr),
          duration = VALUES(duration),
          price = VALUES(price),
          maxCap = VALUES(maxCap),
          location = VALUES(location),
          imagePath = VALUES(imagePath)
      `,
      [
        attrId,
        operatorId,
        tour.title,
        tour.description,
        tour.duration,
        tour.price,
        tour.maxCap,
        tour.location,
        tour.imagePath,
      ]
    );

    const [tourRows] = await connection.query(
      'SELECT tourID, maxCap FROM Tour WHERE title = ? LIMIT 1',
      [tour.title]
    );
    const seededTour = tourRows[0];

    const today = new Date();
    const startDate = toIsoDateString(today);
    const endDate = toIsoDateString(new Date(Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate() + 180
    )));

    await ensureAvailabilityForRange(connection, {
      tourId: seededTour.tourID,
      maxCapacity: seededTour.maxCap,
      startDate,
      endDate,
    });
  }
}

async function seedReviewsTable(connection, userIds) {
  for (const review of seedReviews) {
    const userId = userIds[review.reviewer];
    const [tourRows] = await connection.query(
      'SELECT tourID FROM Tour WHERE title = ? LIMIT 1',
      [review.tour]
    );

    if (!userId || !tourRows[0]) {
      continue;
    }

    await connection.query(
      `
        INSERT INTO Review (userID, tourID, rating, comment, createdAt)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          rating = VALUES(rating),
          comment = VALUES(comment),
          createdAt = VALUES(createdAt)
      `,
      [userId, tourRows[0].tourID, review.rating, review.comment, review.date]
    );
  }
}

async function initializeDatabase() {
  await createDatabaseIfNeeded();

  const connection = await pool.getConnection();
  try {
    await createTables(connection);
    await seedReferenceData(connection);
    const userIds = await seedUsers(connection);
    await seedOperatorsTable(connection, userIds);
    await seedAttractionsTable(connection);
    await seedToursTable(connection);
    await seedReviewsTable(connection, userIds);
  } finally {
    connection.release();
  }
}

module.exports = {
  initializeDatabase,
};

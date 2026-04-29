const CATEGORY_COLORS = {
  Archaeological: '#6d4c41',
  Marine: '#1565c0',
  Wildlife: '#2e7d32',
  Cultural: '#ef6c00',
};

function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || '#4e342e';
}

function normalizeAssetPath(pathValue, fallback = '/images/logo.png') {
  if (!pathValue) {
    return fallback;
  }

  if (pathValue.startsWith('data:')) {
    return pathValue;
  }

  if (pathValue.startsWith('/')) {
    return pathValue;
  }

  return `/${pathValue.replace(/^\/+/, '')}`;
}

function mapAttraction(row) {
  return {
    id: row.id,
    name: row.name,
    cat: row.category,
    loc: row.location,
    price: Number(row.price),
    rating: Number(row.rating || 0),
    reviewCount: Number(row.reviewCount || 0),
    img: normalizeAssetPath(row.imagePath, '/images/jungle-bg.jpg'),
    desc: row.description,
    color: getCategoryColor(row.category),
  };
}

function mapTour(row) {
  const color = getCategoryColor(row.category);

  return {
    id: row.id,
    attrID: row.attrID,
    attractionName: row.attractionName,
    category: row.category,
    location: row.location,
    name: row.name,
    operator: row.operatorName,
    duration: `${row.duration} hrs`,
    durationHours: Number(row.duration),
    price: Number(row.price),
    cap: Number(row.maxCapacity),
    avgRating: row.avgRating === null ? null : Number(row.avgRating),
    reviewCount: Number(row.reviewCount || 0),
    img: normalizeAssetPath(row.imagePath, '/images/tour1.jpg'),
    color,
    desc: row.description,
  };
}

function mapReview(row) {
  return {
    id: row.id,
    tourID: row.tourID,
    userID: row.userID,
    userName: row.userName,
    rating: Number(row.rating),
    comment: row.comment || '',
    date: row.date,
    tourName: row.tourName || null,
  };
}

function mapBooking(row) {
  return {
    id: row.id,
    userID: row.userID,
    tourID: row.tourID,
    tourName: row.tourName,
    attraction: row.attraction,
    location: row.location,
    tourDate: row.tourDate,
    personCount: Number(row.personCount),
    paymentMethod: row.paymentMethod,
    paymentSuccess: row.paymentSuccess === null || row.paymentSuccess === undefined ? null : Boolean(row.paymentSuccess),
    paymentDate: row.paymentDate || null,
    total: Number(row.total),
    season: row.season,
    status: row.status,
    bookedAt: row.bookedAt,
  };
}

async function listAttractions(connection, { search = '', category = '' } = {}) {
  const params = [];
  const conditions = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push('a.title LIKE ?');
  }

  if (category && category.toLowerCase() !== 'all') {
    params.push(category);
    conditions.push('c.catName = ?');
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await connection.query(
    `
      SELECT
        a.attrID AS id,
        a.title AS name,
        a.descr AS description,
        c.catName AS category,
        a.location AS location,
        a.basePrice AS price,
        COALESCE(ROUND(AVG(r.rating), 1), 0) AS rating,
        COUNT(DISTINCT r.reviewID) AS reviewCount,
        COALESCE(
          MAX(CASE WHEN m.displayOrder = 0 THEN m.mediaPath END),
          MAX(m.mediaPath)
        ) AS imagePath
      FROM Attraction a
      INNER JOIN AttrCategory c ON c.catID = a.catID
      LEFT JOIN AttrMedia m ON m.attrID = a.attrID
      LEFT JOIN Tour t ON t.attrID = a.attrID
      LEFT JOIN Review r ON r.tourID = t.tourID
      ${whereClause}
      GROUP BY a.attrID, a.title, a.descr, c.catName, a.location, a.basePrice
      ORDER BY a.title ASC
    `,
    params
  );

  return rows.map(mapAttraction);
}

async function getAttractionById(connection, attractionId) {
  const [rows] = await connection.query(
    `
      SELECT
        a.attrID AS id,
        a.title AS name,
        a.descr AS description,
        c.catName AS category,
        a.location AS location,
        a.basePrice AS price,
        COALESCE(ROUND(AVG(r.rating), 1), 0) AS rating,
        COUNT(DISTINCT r.reviewID) AS reviewCount,
        COALESCE(
          MAX(CASE WHEN m.displayOrder = 0 THEN m.mediaPath END),
          MAX(m.mediaPath)
        ) AS imagePath
      FROM Attraction a
      INNER JOIN AttrCategory c ON c.catID = a.catID
      LEFT JOIN AttrMedia m ON m.attrID = a.attrID
      LEFT JOIN Tour t ON t.attrID = a.attrID
      LEFT JOIN Review r ON r.tourID = t.tourID
      WHERE a.attrID = ?
      GROUP BY a.attrID, a.title, a.descr, c.catName, a.location, a.basePrice
    `,
    [attractionId]
  );

  return rows[0] ? mapAttraction(rows[0]) : null;
}

async function listTours(connection, filters = {}) {
  const params = [];
  const conditions = [];

  if (filters.attractionId) {
    params.push(filters.attractionId);
    conditions.push('t.attrID = ?');
  }

  if (filters.operatorId) {
    params.push(filters.operatorId);
    conditions.push('t.operatorID = ?');
  }

  if (filters.search) {
    params.push(`%${filters.search}%`, `%${filters.search}%`);
    conditions.push('(t.title LIKE ? OR a.title LIKE ?)');
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await connection.query(
    `
      SELECT
        t.tourID AS id,
        t.attrID AS attrID,
        a.title AS attractionName,
        c.catName AS category,
        COALESCE(t.location, a.location) AS location,
        t.title AS name,
        o.companyName AS operatorName,
        t.duration AS duration,
        t.price AS price,
        t.maxCap AS maxCapacity,
        t.descr AS description,
        t.imagePath AS imagePath,
        ROUND(AVG(r.rating), 1) AS avgRating,
        COUNT(DISTINCT r.reviewID) AS reviewCount
      FROM Tour t
      INNER JOIN Attraction a ON a.attrID = t.attrID
      INNER JOIN AttrCategory c ON c.catID = a.catID
      INNER JOIN Operator o ON o.operatorID = t.operatorID
      LEFT JOIN Review r ON r.tourID = t.tourID
      ${whereClause}
      GROUP BY
        t.tourID, t.attrID, a.title, c.catName, t.location, a.location, t.title,
        o.companyName, t.duration, t.price, t.maxCap, t.descr, t.imagePath
      ORDER BY t.price DESC, t.title ASC
    `,
    params
  );

  return rows.map(mapTour);
}

async function getTourById(connection, tourId) {
  const tours = await listTours(connection, { });
  return tours.find((tour) => tour.id === Number(tourId)) || null;
}

async function listReviews(connection, { tourId, attractionId } = {}) {
  const params = [];
  const conditions = [];

  if (tourId) {
    params.push(tourId);
    conditions.push('r.tourID = ?');
  }

  if (attractionId) {
    params.push(attractionId);
    conditions.push('t.attrID = ?');
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await connection.query(
    `
      SELECT
        r.reviewID AS id,
        r.tourID AS tourID,
        r.userID AS userID,
        CONCAT(u.fName, ' ', u.lName) AS userName,
        r.rating AS rating,
        r.comment AS comment,
        r.createdAt AS date,
        t.title AS tourName
      FROM Review r
      INNER JOIN Users u ON u.userID = r.userID
      INNER JOIN Tour t ON t.tourID = r.tourID
      ${whereClause}
      ORDER BY r.createdAt DESC
    `,
    params
  );

  return rows.map(mapReview);
}

module.exports = {
  getAttractionById,
  getCategoryColor,
  getTourById,
  listAttractions,
  listReviews,
  listTours,
  mapAttraction,
  mapBooking,
  mapReview,
  mapTour,
  normalizeAssetPath,
};

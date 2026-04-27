function roundCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function average(numbers, fallback = 0) {
  if (!numbers.length) {
    return fallback;
  }
  return numbers.reduce((sum, number) => sum + Number(number || 0), 0) / numbers.length;
}

function getUserName(user) {
  return `${user.firstName || ''} ${user.lastName || ''}`.trim();
}

function getSeasonForDate(dateString) {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;

  if ([12, 1].includes(month)) {
    return { label: 'Peak', multiplier: 1.25 };
  }

  if ([6, 7, 8].includes(month)) {
    return { label: 'Off-Peak', multiplier: 0.85 };
  }

  return { label: 'Standard', multiplier: 1 };
}

function calculateBookingTotal(tour, personCount, tourDate) {
  const season = getSeasonForDate(tourDate);
  const total = roundCurrency(Number(tour.price) * Number(personCount) * season.multiplier);
  return {
    season,
    total,
  };
}

function getOperator(data, operatorId) {
  return data.operators.find((entry) => entry.id === operatorId) || null;
}

function getAttraction(data, attractionId) {
  return data.attractions.find((entry) => entry.id === attractionId) || null;
}

function getTour(data, tourId) {
  return data.tours.find((entry) => entry.id === tourId) || null;
}

function getReviewsForTour(data, tourId) {
  return data.reviews.filter((entry) => entry.tourID === tourId);
}

function getRemainingSlots(data, tourId, dateString) {
  const tour = getTour(data, tourId);
  if (!tour) {
    return 0;
  }

  const selectedDate = new Date(dateString);
  if (selectedDate.getDay() === 0) {
    return 0;
  }

  const seatsTaken = data.bookings
    .filter((entry) => entry.tourID === tourId && entry.tourDate === dateString && entry.status !== 'Cancelled')
    .reduce((sum, entry) => sum + Number(entry.personCount || 0), 0);

  return Math.max(0, Number(tour.maxCap) - seatsTaken);
}

function buildAvailability(data, tourId, year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const availability = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const slots = getRemainingSlots(data, tourId, dateString);
    availability.push({
      date: dateString,
      slots,
      available: slots > 0,
    });
  }

  return availability;
}

function presentUser(data, user) {
  const operator = user.operatorId ? getOperator(data, user.operatorId) : data.operators.find((entry) => entry.userId === user.id) || null;

  return {
    id: user.id,
    email: user.email,
    name: getUserName(user),
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    nationality: user.nationality || '',
    companyName: operator ? operator.companyName : '',
    businessEmail: operator ? operator.contactEmail : '',
    phoneNum: operator ? operator.phoneNum : '',
    operatorId: operator ? operator.id : null,
  };
}

function presentAttraction(data, attraction) {
  const relatedTourIds = data.tours
    .filter((tour) => tour.attrID === attraction.id)
    .map((tour) => tour.id);

  const ratingValues = data.reviews
    .filter((review) => relatedTourIds.includes(review.tourID))
    .map((review) => Number(review.rating));

  const rating = ratingValues.length ? average(ratingValues) : Number(attraction.seedRating || 0);

  return {
    id: attraction.id,
    name: attraction.title,
    cat: attraction.category,
    loc: attraction.location,
    price: Number(attraction.basePrice),
    rating: Number(rating.toFixed(1)),
    img: attraction.image,
    desc: attraction.description,
    color: attraction.color,
  };
}

function presentTour(data, tour) {
  const attraction = getAttraction(data, tour.attrID);
  const operator = getOperator(data, tour.operatorID);
  const reviews = getReviewsForTour(data, tour.id);
  const rating = reviews.length ? average(reviews.map((review) => Number(review.rating))) : null;

  return {
    id: tour.id,
    attrID: tour.attrID,
    name: tour.title,
    operator: operator ? operator.companyName : 'Independent Operator',
    duration: `${tour.durationHours} hrs`,
    durationHours: Number(tour.durationHours),
    price: Number(tour.price),
    cap: Number(tour.maxCap),
    img: tour.image,
    color: tour.color || (attraction ? attraction.color : '#1a4d2e'),
    desc: tour.description,
    location: tour.location || (attraction ? attraction.location : ''),
    attractionName: attraction ? attraction.title : '',
    rating: rating ? Number(rating.toFixed(1)) : null,
  };
}

function presentBooking(data, booking) {
  const tour = getTour(data, booking.tourID);
  const attraction = tour ? getAttraction(data, tour.attrID) : null;

  return {
    id: booking.id,
    userID: booking.userID,
    tourID: booking.tourID,
    tourName: tour ? tour.title : 'Unknown tour',
    attraction: attraction ? attraction.title : '',
    location: tour ? tour.location : attraction ? attraction.location : '',
    tourDate: booking.tourDate,
    personCount: Number(booking.personCount),
    paymentMethod: booking.paymentMethod,
    total: Number(booking.totalPrice),
    season: booking.season,
    status: booking.status,
    bookedAt: booking.bookedAt,
  };
}

function presentReview(data, review) {
  const user = review.userID ? data.users.find((entry) => entry.id === review.userID) : null;
  const tour = getTour(data, review.tourID);

  return {
    id: review.id,
    tourID: review.tourID,
    userID: review.userID,
    userName: review.userName || (user ? getUserName(user) : 'Anonymous'),
    rating: Number(review.rating),
    comment: review.comment || '',
    date: review.createdAt,
    tourName: tour ? tour.title : '',
  };
}

function buildDashboard(data) {
  const popularTours = data.tours
    .map((tour) => {
      const confirmedBookings = data.bookings
        .filter((booking) => booking.tourID === tour.id && booking.status !== 'Cancelled')
        .reduce((sum, booking) => sum + Number(booking.personCount || 0), 0);

      return {
        ...presentTour(data, tour),
        bookings: confirmedBookings,
      };
    })
    .sort((left, right) => right.bookings - left.bookings)
    .slice(0, 4);

  return {
    totalUsers: data.users.filter((user) => user.active).length,
    totalBookings: data.bookings.filter((booking) => booking.status !== 'Cancelled').length,
    totalReviews: data.reviews.length,
    popularTours,
  };
}

module.exports = {
  getUserName,
  getSeasonForDate,
  calculateBookingTotal,
  getAttraction,
  getTour,
  getRemainingSlots,
  buildAvailability,
  presentUser,
  presentAttraction,
  presentTour,
  presentBooking,
  presentReview,
  buildDashboard,
};

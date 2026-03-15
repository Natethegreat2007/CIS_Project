export interface User{
    userID:number;
    email:string;
    fName:string;
    lName:string;
    role: 'Admin' | 'Operator' | 'Tourist';
    active: boolean;
}

export interface Booking{
    bookingID:number;
    userID:number;
    tourID:number;
    tourName:string;
    attraction:string;
    location:string;
    tourDate:string;
    personCount:number;
    price:number;
    season:string;
    status: 'Pending'|'Confirmed'|'Cancelled';
    bookedAt:string;
    paymentMethod:string;
}
export interface Review{
    reviewID:number;
    userName:string;
    rating:number;
    comment:string;
    createdAt:string;
}
export interface Tour{
    tourID:number;
    attrID:number;
    operatorID:number;
    operatorName:string;
    title:string;
    duration:number;
    price:number;
    maxCap:number;
    attrTitle:string;
    avgRating:number;
}
export interface Attraction{
    attrID:number;
    title:string;
    descr:string;
    catName: 'Archaeological' | 'Marine' | 'Wildlife' | 'Cultural';
    location:string;
    basePrice: number;
    mediaPath:string;
    mediaType: string;
    alt: string;
}
export interface Availability{
    availabilityID:number;
    date:string;
    slots:number;
}
export interface Operator{
    operatorID:number;
    companyName:string;
    contactEmail:string;
    phoneNumber:string;
}
export interface Payment{
    amount:number;
    method:string;
    date:string;
}

export interface JWTPayload{
    id:number;
    role: 'Admin' | 'Operator' | 'Tourist';
    name:string;
}
export interface LoginRequest{
    email:string;
    password:string;
}

export interface RegisterRequest{
    email:string;
    password:string;
    fName:string;
    lName:string;
}
export interface AuthResponse{
    token:string;
    role: 'Admin' | 'Operator' | 'Tourist';
}
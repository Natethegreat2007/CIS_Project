export interface Users{
    userId:number;
    email:string;
    fName:string;
    lName:string;
    roleName: 'admin' | 'operator' | 'tourist';
    active: boolean;
}

export interface Bookings{
    bookingId:number;
    userId:number;
    tourId:number;
    tourName:string;
    attraction:string;
    location:string;
    tourDate:Date;
    personCount:number;
    paymentMethod:string;
}
export interface Reviews{
    reviewId:number;
    tourId:number;
    userId:number;
    userName:string;
    rating:number;
    comment:string;
    date:Date;
}
export interface Tours{
    tourId:number;
    attractionId:number;
    tourName:string;
    operator:string;
    duration:string;
    price:number;
    capacity:number;
}
export interface Attractions{
    attractionId:number;
    attractionName:string;
    category:string;
    location:string;
}
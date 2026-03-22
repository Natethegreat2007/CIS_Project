import BookingRepository from '../repositories/BookingRepository';
import TourRepository    from '../repositories/TourRepository';
import { Booking }       from '../types';

const getMultiplier = (dateStr: string): { label: string; mult: number } => {
    const m = new Date(dateStr).getMonth() + 1;
    if ([12, 1].includes(m))   return { label: 'Peak',     mult: 1.25 };
    if ([6, 7, 8].includes(m)) return { label: 'Off-Peak', mult: 0.85 };
    return                            { label: 'Standard', mult: 1.00 };
};

const BookingService = {

    getMine: async (userID: number): Promise<Booking[]> => {
        return await BookingRepository.findByUser(userID);
    },

    getAll: async (): Promise<Booking[]> => {
        return await BookingRepository.findAll();
    },

    create: async (data: {
        userID:        number;
        tourID:        number;
        tourDate:      string;
        personCount:   number;
        paymentMethod: string;
    }): Promise<{ ok: boolean; status: number; bookingID?: number; total?: number; season?: string; error?: string }> => {
        const tour = await TourRepository.findByID(data.tourID);
        if (!tour) return { ok: false, status: 404, error: 'Tour not found.' };

        const { label, mult } = getMultiplier(data.tourDate);
        const total = parseFloat((tour.price * data.personCount * mult).toFixed(2));

        const result = await BookingRepository.createWithTransaction({
            ...data,
            price: total
        });

        if (result.conflict) return { ok: false, status: 409, error: 'Not enough slots.' };

        return {
            ok:        true,
            status:    201,
            bookingID: result.bookingID,
            total,
            season:    label
        };
    },

    cancel: async (
        bookingID: number,
        userID:    number,
        role:      string
    ): Promise<{ ok: boolean; status: number; error?: string }> => {
        const booking = await BookingRepository.findByID(bookingID);
        if (!booking) return { ok: false, status: 404, error: 'Booking not found.' };

        if (role !== 'Admin' && booking.userID !== userID) {
            return { ok: false, status: 403, error: 'Forbidden.' };
        }
        if (booking.status === 'Cancelled') {
            return { ok: false, status: 409, error: 'Already cancelled.' };
        }

        await BookingRepository.updateStatus(bookingID, 'Cancelled');
        return { ok: true, status: 200 };
    }

};

export default BookingService;
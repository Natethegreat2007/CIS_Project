import { Request, Response } from 'express';
import BookingService         from '../services/BookingService';

const BookingController = {

    getMine: async (req: Request, res: Response): Promise<void> => {
        try {
            const userID = req.user?.id as number;
            const data   = await BookingService.getMine(userID);
            res.status(200).json(data);
        } catch (err) {
            res.status(500).json({ error: 'Server error.' });
        }
    },

    getAll: async (req: Request, res: Response): Promise<void> => {
        try {
            const data = await BookingService.getAll();
            res.status(200).json(data);
        } catch (err) {
            res.status(500).json({ error: 'Server error.' });
        }
    },

    create: async (req: Request, res: Response): Promise<void> => {
        try {
            const userID = req.user?.id as number;
            const { tourID, tourDate, personCount, paymentMethod } = req.body;

            if (!tourID || !tourDate || !personCount || !paymentMethod) {
                res.status(400).json({ error: 'All fields required.' });
                return;
            }

            const result = await BookingService.create({
                userID,
                tourID:        Number(tourID),
                tourDate,
                personCount:   Number(personCount),
                paymentMethod
            });

            if (!result.ok) {
                res.status(result.status).json({ error: result.error });
                return;
            }

            res.status(201).json({
                bookingID: result.bookingID,
                total:     result.total,
                season:    result.season,
                status:    'Pending'
            });
        } catch (err) {
            res.status(500).json({ error: 'Server error.' });
        }
    },

    cancel: async (req: Request, res: Response): Promise<void> => {
        try {
            const bookingID = Number(req.params.id);
            const userID    = req.user?.id    as number;
            const role      = req.user?.role  as string;
            const result    = await BookingService.cancel(bookingID, userID, role);

            if (!result.ok) {
                res.status(result.status).json({ error: result.error });
                return;
            }
            res.status(200).json({ message: 'Booking cancelled.' });
        } catch (err) {
            res.status(500).json({ error: 'Server error.' });
        }
    }

};

export default BookingController;
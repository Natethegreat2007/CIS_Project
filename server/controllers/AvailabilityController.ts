import { Request, Response } from 'express';
import AvailabilityService    from '../services/AvailabilityService';

const AvailabilityController = {

    getForTour: async (req: Request, res: Response): Promise<void> => {
        try {
            const tourID = Number(req.params.tourID);
            const data   = await AvailabilityService.getForTour(tourID);
            res.status(200).json(data);
        } catch (err) {
            res.status(500).json({ error: 'Server error.' });
        }
    },

    create: async (req: Request, res: Response): Promise<void> => {
        try {
            const { tourID, date, slots } = req.body;
            if (!tourID || !date || slots === undefined) {
                res.status(400).json({ error: 'All fields required.' });
                return;
            }
            const result = await AvailabilityService.create({
                tourID: Number(tourID),
                date,
                slots:  Number(slots)
            });
            if (!result.ok) {
                res.status(result.status).json({ error: result.error });
                return;
            }
            res.status(201).json({ availabilityID: result.availabilityID, message: 'Date added.' });
        } catch (err) {
            res.status(500).json({ error: 'Server error.' });
        }
    },

    update: async (req: Request, res: Response): Promise<void> => {
        try {
            const id     = Number(req.params.id);
            const { slots } = req.body;
            if (slots === undefined) {
                res.status(400).json({ error: 'Slots required.' });
                return;
            }
            const result = await AvailabilityService.update(id, Number(slots));
            if (!result.ok) {
                res.status(result.status).json({ error: result.error });
                return;
            }
            res.status(200).json({ message: 'Availability updated.' });
        } catch (err) {
            res.status(500).json({ error: 'Server error.' });
        }
    }

};

export default AvailabilityController;
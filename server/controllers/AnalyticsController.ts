import { Request, Response } from 'express';
import AnalyticsService       from '../services/AnalyticsService';

const AnalyticsController = {

    getSummary: async (req: Request, res: Response): Promise<void> => {
        try {
            const data = await AnalyticsService.getSummary();
            res.status(200).json(data);
        } catch (err) {
            res.status(500).json({ error: 'Server error.' });
        }
    },

    getBookings: async (req: Request, res: Response): Promise<void> => {
        try {
            const data = await AnalyticsService.getBookings();
            res.status(200).json(data);
        } catch (err) {
            res.status(500).json({ error: 'Server error.' });
        }
    }

};

export default AnalyticsController;
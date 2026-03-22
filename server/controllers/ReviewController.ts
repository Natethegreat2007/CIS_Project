import { Request, Response } from 'express';
import ReviewService          from '../services/ReviewService';

const ReviewController = {

    getForTour: async (req: Request, res: Response): Promise<void> => {
        try {
            const tourID = Number(req.params.tourID);
            const data   = await ReviewService.getForTour(tourID);
            res.status(200).json(data);
        } catch (err) {
            res.status(500).json({ error: 'Server error.' });
        }
    },

    submit: async (req: Request, res: Response): Promise<void> => {
        try {
            const userID             = req.user?.id as number;
            const { tourID, rating, comment } = req.body;

            if (!tourID || !rating || !comment) {
                res.status(400).json({ error: 'All fields required.' });
                return;
            }

            const result = await ReviewService.submit({
                userID,
                tourID:  Number(tourID),
                rating:  Number(rating),
                comment
            });

            if (!result.ok) {
                res.status(result.status).json({ error: result.error });
                return;
            }

            res.status(201).json({ reviewID: result.reviewID, message: 'Review submitted.' });
        } catch (err) {
            res.status(500).json({ error: 'Server error.' });
        }
    }

};

export default ReviewController;
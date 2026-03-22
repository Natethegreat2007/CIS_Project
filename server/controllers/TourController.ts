import { Request, Response } from 'express';
import TourService            from '../services/TourService';

const TourController = {

    getAll: async (req: Request, res: Response): Promise<void> => {
        try {
            const { attrID, page, limit } = req.query;
            const data = await TourService.getAll({
                attrID: attrID ? Number(attrID) : undefined,
                page:   Number(page)  || 1,
                limit:  Number(limit) || 10
            });
            res.status(200).json(data);
        } catch (err) {
            res.status(500).json({ error: 'Server Error.' });
        }
    },

    getOne: async (req: Request, res: Response): Promise<void> => {
        try {
            const id   = Number(req.params.id);
            const tour = await TourService.getByID(id);
            if (!tour) {
                res.status(404).json({ error: 'Tour not found.' });
                return;
            }
            res.status(200).json(tour);
        } catch (err) {
            res.status(500).json({ error: 'Server Error.' });
        }
    },

    create: async (req: Request, res: Response): Promise<void> => {
        try {
            const operatorID = req.user?.id as number;
            const tourID     = await TourService.create({ ...req.body, operatorID });
            res.status(201).json({ tourID, message: 'Tour created.' });
        } catch (err) {
            res.status(500).json({ error: 'Server Error.' });
        }
    },

    update: async (req: Request, res: Response): Promise<void> => {
        try {
            const id     = Number(req.params.id);
            const userID = req.user?.id as number;
            const result = await TourService.update(id, userID, req.body);
            if (!result.ok) {
                res.status(result.status).json({ error: result.error });
                return;
            }
            res.status(200).json({ message: 'Tour updated.' });
        } catch (err) {
            res.status(500).json({ error: 'Server Error.' });
        }
    },

    patch: async (req: Request, res: Response): Promise<void> => {
        try {
            const id     = Number(req.params.id);
            const userID = req.user?.id as number;
            const result = await TourService.patch(id, userID, req.body);
            if (!result.ok) {
                res.status(result.status).json({ error: result.error });
                return;
            }
            res.status(200).json({ message: 'Tour updated.' });
        } catch (err) {
            res.status(500).json({ error: 'Server Error.' });
        }
    },

    remove: async (req: Request, res: Response): Promise<void> => {
        try {
            const id     = Number(req.params.id);
            const userID = req.user?.id as number;
            const result = await TourService.remove(id, userID);
            if (!result.ok) {
                res.status(result.status).json({ error: result.error });
                return;
            }
            res.status(200).json({ message: 'Tour deleted.' });
        } catch (err) {
            res.status(500).json({ error: 'Server Error.' });
        }
    }

};

export default TourController;
import { Request, Response } from 'express';
import OperatorService        from '../services/OperatorService';

const OperatorController = {

    getAll: async (req: Request, res: Response): Promise<void> => {
        try {
            const data = await OperatorService.getAll();
            res.status(200).json(data);
        } catch (err) {
            res.status(500).json({ error: 'Server error.' });
        }
    },

    getTours: async (req: Request, res: Response): Promise<void> => {
        try {
            const id   = Number(req.params.id);
            const data = await OperatorService.getTours(id);
            res.status(200).json(data);
        } catch (err) {
            res.status(500).json({ error: 'Server error.' });
        }
    },

    update: async (req: Request, res: Response): Promise<void> => {
        try {
            const id     = Number(req.params.id);
            const result = await OperatorService.update(id, req.body);
            if (!result.ok) {
                res.status(result.status).json({ error: result.error });
                return;
            }
            res.status(200).json({ message: 'Operator updated.' });
        } catch (err) {
            res.status(500).json({ error: 'Server error.' });
        }
    }

};

export default OperatorController;
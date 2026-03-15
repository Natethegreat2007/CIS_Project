import {NextFunction, Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import {JWTPayload} from '../types';

export default (req: Request, res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No token provided.' });
        return;
    }

    try {
        const token   = header.split(' ')[1];
        req.user      = jwt.verify(token, process.env.JWT_SECRET as string) as JWTPayload;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
};
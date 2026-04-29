import { Request, Response } from 'express';
import AuthService            from '../services/AuthService';

const AuthController = {

    login: async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({ error: 'Email and password required.' });
                return;
            }
            const result = await AuthService.login(email, password);
            if (!result.ok) {
                res.status(401).json({ error: result.error });
                return;
            }
            res.status(200).json({ token: result.token, role: result.role });
        } catch (err) {
            console.error('LOGIN ERROR:', err);  // ← add this
            res.status(500).json({ error: 'Server error.' });
        }
    },

    register: async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, password, fName, lName, role } = req.body;
            if (!email || !password || !fName || !lName) {
                res.status(400).json({ error: 'All fields required.' });
                return;
            }
            if (role && !['Tourist', 'Operator'].includes(role)) {
                res.status(400).json({ error: 'Invalid role.' });
                return;
            }
            const result = await AuthService.register({ email, password, fName, lName, role });
            if (!result.ok) {
                res.status(409).json({ error: result.error });
                return;
            }
            res.status(201).json({ token: result.token });
        } catch (err) {
            res.status(500).json({ error: 'Server error.' });
        }
    },

    logout: async (req: Request, res: Response): Promise<void> => {
        try {
            res.status(200).json({ message: 'Logged out.' });
        } catch (err) {
            res.status(500).json({ error: 'Server error.' });
        }
    }

};

export default AuthController;
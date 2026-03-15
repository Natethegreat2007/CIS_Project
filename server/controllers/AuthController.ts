import { Request, Response } from 'express';

const AuthController = {

    login: async (req: Request, res: Response): Promise<void> => {
        try {
            // extract
            const { email, password } = req.body;

            // validate body exists
            if (!email || !password) {
                res.status(400).json({ error: 'Email and password required.' });
                return;
            }

            // TODO: replace with AuthService.login(email, password)
            const token = 'stub-token';
            const role  = 'Tourist';

            res.status(200).json({ token, role });
        } catch (err) {
            res.status(500).json({ error: 'Server error.' });
        }
    },

    register: async (req: Request, res: Response): Promise<void> => {
        try {
            // extract
            const { email, password, fName, lName, role } = req.body;

            // validate all fields present
            if (!email || !password || !fName || !lName) {
                res.status(400).json({ error: 'All fields required.' });
                return;
            }

            // validate role value
            if (role && !['Tourist', 'Operator'].includes(role)) {
                res.status(400).json({ error: 'Invalid role.' });
                return;
            }

            // TODO: replace with AuthService.register({ email, password, fName, lName, role })
            const token = 'stub-token';

            res.status(201).json({ token, role: role || 'Tourist' });
        } catch (err) {
            res.status(500).json({ error: 'Server error.' });
        }
    },

    logout: async (req: Request, res: Response): Promise<void> => {
        try {
            // JWT is stateless — client drops the token
            // nothing to do server side in prototype
            res.status(200).json({ message: 'Logged out.' });
        } catch (err) {
            res.status(500).json({ error: 'Server error.' });
        }
    }

};

export default AuthController;
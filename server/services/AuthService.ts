import argon2         from 'argon2';
import jwt            from 'jsonwebtoken';
import AuthRepository from '../repositories/AuthRepository';
import { JWTPayload } from '../types';

const AuthService = {

    login: async (email: string, password: string): Promise<{
        ok:     boolean;
        token?: string;
        role?:  string;
        error?: string;
    }> => {
        const user = await AuthRepository.findByEmail(email);
        if (!user) return { ok: false, error: 'Invalid credentials.' };

        const valid = await argon2.verify(user.passwordHash, password);
        if (!valid) return { ok: false, error: 'Invalid credentials.' };

        if (!user.active) return { ok: false, error: 'Account suspended.' };

        const payload: JWTPayload = {
            id:   user.userID,
            role: user.role,
            name: `${user.fName} ${user.lName}`
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
            expiresIn: '60m'
        });

        return { ok: true, token, role: user.role };
    },

    register: async (data: {
        email:    string;
        password: string;
        fName:    string;
        lName:    string;
        role?:    string;
    }): Promise<{ ok: boolean; token?: string; error?: string }> => {
        const exists = await AuthRepository.emailExists(data.email);
        if (exists) return { ok: false, error: 'Email already registered.' };

        const passwordHash = await argon2.hash(data.password);
        const roleID       = data.role === 'Operator' ? 2 : 3;

        const userID = await AuthRepository.create({
            email: data.email,
            passwordHash,
            fName:  data.fName,
            lName:  data.lName,
            roleID
        });

        const payload: JWTPayload = {
            id:   userID,
            role: data.role === 'Operator' ? 'Operator' : 'Tourist',
            name: `${data.fName} ${data.lName}`
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
            expiresIn: '60m'
        });

        return { ok: true, token };
    }

};

export default AuthService;
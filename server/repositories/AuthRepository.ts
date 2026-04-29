import pool from '../db';
import { User } from '../types';

const AuthRepository = {

    findByEmail: async (email: string): Promise<(User & { passwordHash: string }) | null> => {
        const [rows] = await pool.query(`
            SELECT
                u.userID,
                u.email,
                u.passwordHash,
                u.fName,
                u.lName,
                u.active,
                r.roleName AS role
            FROM users u
            JOIN role r ON u.roleID = r.roleID
            WHERE u.email = ?
        `, [email]);
        const results = rows as (User & { passwordHash: string })[];
        return results[0] || null;
    },

    create: async (data: {
        email:        string;
        passwordHash: string;
        fName:        string;
        lName:        string;
        roleID:       number;
    }): Promise<number> => {
        const [result] = await pool.query(`
            INSERT INTO users (email, passwordHash, fName, lName, roleID)
            VALUES (?, ?, ?, ?, ?)
        `, [data.email, data.passwordHash, data.fName, data.lName, data.roleID]);
        return (result as any).insertId;
    },

    emailExists: async (email: string): Promise<boolean> => {
        const [rows] = await pool.query(`
            SELECT userID FROM users WHERE email = ?
        `, [email]);
        return (rows as any[]).length > 0;
    }

};

export default AuthRepository;
import pool from "../db";
import {User} from "../types";

const UserRepository ={
    getAll: async({userID, page = 1, limit = 10}:{
        userID?:number;
        page?:number;
        limit?:number;
    }):Promise<User[]>=>{
        const offset = (page - 1) * limit;
        const [rows] = await pool.query(`
            SELECT * FROM users
            WHERE (? IS NULL OR userID = ?)
            LIMIT ? OFFSET ?
        `, [userID ?? null, userID ?? null, limit, offset]);
        return rows as User[];
    },
    getByID: async(userID:number):Promise<User|null> =>{
        const [rows] = await pool.query(`
            SELECT * FROM users WHERE userID = ?
        `, [userID]);
        const results = rows as User[];
        return results[0] || null;
    }
}

export default UserRepository;
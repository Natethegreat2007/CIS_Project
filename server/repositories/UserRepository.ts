import pool from "../db";
import {User} from "../types";

const UserRepository ={
    findAll: async({userID, page = 1, limit = 10}:{
        userID?:number|undefined;
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

    findByID: async(userID:number|undefined):Promise<User|null> =>{
        const [rows] = await pool.query(`
            SELECT * FROM users WHERE userID = ?
        `, [userID]);
        const results = rows as User[];
        return results[0] || null;
    },
    patch: async(userID:number|undefined, fields:Partial<User>):Promise<void> =>{
        const entries = Object.entries(fields);
        if(entries.length === 0) return;

        const setClause = entries.map(([key]) =>`${key} = ?`).join(',');
        const values = entries.map(([, val]) => val);

        await pool.query(
            `UPDATE users SET ${setClause} WHERE userID = ?`,
            [...values, userID]
        );
    },
    setActive: async(userID:number|undefined, active: boolean):Promise<void> =>{
        await pool.query(`
        UPDATE users SET active = ? WHERE userID = ?
        `, [active, userID]);
    },
    deactivate: async(userID:number|undefined):Promise<void> =>{
        await pool.query(`
			UPDATE users
			SET active = FALSE, deletedAt = CURRENT_TIMESTAMP
			WHERE userID = ?
        `, [userID]);
    },

    setRole: async(userID:number|undefined, role:string):Promise<void> =>{
        const[roleRows] = await pool.query(`
        SELECT roleID FROM role WHERE roleName = ?`, [role]);
        const roles = roleRows as {roleID:number}[];
        if(!roles.length) throw new Error(`Role: ${role} not found.`);

        await pool.query(`
        UPDATE users SET roleID = ? WHERE userID = ?
        `, [roles[0].roleID, userID]);
    }

}

export default UserRepository;
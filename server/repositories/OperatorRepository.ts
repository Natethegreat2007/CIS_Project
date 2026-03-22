import pool           from '../db';
import { Operator }   from '../types';

const OperatorRepository = {

    findAll: async (): Promise<Operator[]> => {
        const [rows] = await pool.query(`
            SELECT operatorID, companyName, contactEmail, phoneNum
            FROM operator
        `);
        return rows as Operator[];
    },

    findByID: async (operatorID: number): Promise<Operator | null> => {
        const [rows] = await pool.query(`
            SELECT operatorID, companyName, contactEmail, phoneNum
            FROM operator
            WHERE operatorID = ?
        `, [operatorID]);
        const results = rows as Operator[];
        return results[0] || null;
    },

    findTours: async (operatorID: number) => {
        const [rows] = await pool.query(`
            SELECT
                t.tourID,
                t.title,
                t.duration,
                t.price,
                t.maxCap,
                a.title AS attrTitle
            FROM tour t
            JOIN attraction a ON t.attrID = a.attrID
            WHERE t.operatorID = ?
        `, [operatorID]);
        return rows;
    },

    update: async (operatorID: number, data: Partial<Operator>): Promise<void> => {
        const entries = Object.entries(data).filter(([key]) =>
            !['operatorID'].includes(key)
        );
        if (entries.length === 0) return;

        const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
        const values    = entries.map(([, val]) => val);

        await pool.query(
            `UPDATE operator SET ${setClause} WHERE operatorID = ?`,
            [...values, operatorID]
        );
    }

};

export default OperatorRepository;
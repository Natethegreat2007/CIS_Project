import pool       from '../db';
import { Tour }   from '../types';

const TourRepository = {

    findAll: async ({ attrID, page = 1, limit = 10 }: {
        attrID?: number;
        page?:   number;
        limit?:  number;
    }): Promise<Tour[]> => {
        const offset = (page - 1) * limit;
        const [rows] = await pool.query(`
            SELECT
                t.tourID,
                t.attrID,
                t.operatorID,
                t.title,
                t.duration,
                t.price,
                t.maxCap,
                o.companyName  AS operatorName,
                a.title        AS attrTitle,
                ROUND(AVG(r.rating), 1) AS avgRating
            FROM tour t
            JOIN operator   o ON t.operatorID = o.operatorID
            JOIN attraction a ON t.attrID     = a.attrID
            LEFT JOIN review r ON t.tourID    = r.tourID
            WHERE (? IS NULL OR t.attrID = ?)
            GROUP BY t.tourID
            LIMIT ? OFFSET ?
        `, [attrID ?? null, attrID ?? null, limit, offset]);
        return rows as Tour[];
    },

    findByID: async (tourID: number): Promise<Tour | null> => {
        const [rows] = await pool.query(`
            SELECT
                t.tourID,
                t.attrID,
                t.operatorID,
                t.title,
                t.duration,
                t.price,
                t.maxCap,
                o.companyName  AS operatorName,
                a.title        AS attrTitle,
                ROUND(AVG(r.rating), 1) AS avgRating
            FROM tour t
            JOIN operator   o ON t.operatorID = o.operatorID
            JOIN attraction a ON t.attrID     = a.attrID
            LEFT JOIN review r ON t.tourID    = r.tourID
            WHERE t.tourID = ?
            GROUP BY t.tourID
        `, [tourID]);
        const results = rows as Tour[];
        return results[0] || null;
    },

    create: async (data: {
        attrID:     number;
        operatorID: number;
        title:      string;
        duration:   number;
        price:      number;
        maxCap:     number;
    }): Promise<number> => {
        const [result] = await pool.query(`
            INSERT INTO tour (attrID, operatorID, title, duration, price, maxCap)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [data.attrID, data.operatorID, data.title,
            data.duration, data.price, data.maxCap]);
        return (result as any).insertId;
    },

    update: async (tourID: number, data: Partial<Tour>): Promise<void> => {
        await pool.query(`
            UPDATE tour
            SET attrID = ?, title = ?, duration = ?, price = ?, maxCap = ?
            WHERE tourID = ?
        `, [data.attrID, data.title, data.duration, data.price, data.maxCap, tourID]);
    },

    patch: async (tourID: number, fields: Partial<Tour>): Promise<void> => {
        const entries = Object.entries(fields).filter(([key]) =>
            !['tourID', 'operatorID', 'attrTitle', 'operatorName', 'avgRating'].includes(key)
        );
        if (entries.length === 0) return;

        const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
        const values    = entries.map(([, val]) => val);

        await pool.query(
            `UPDATE tour SET ${setClause} WHERE tourID = ?`,
            [...values, tourID]
        );
    },

    remove: async (tourID: number): Promise<void> => {
        await pool.query(`
            DELETE FROM tour WHERE tourID = ?
        `, [tourID]);
    }

};

export default TourRepository;
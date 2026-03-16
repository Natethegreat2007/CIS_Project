import pool from '../db';
import { Attraction } from '../types';

const AttractionRepository = {

    findAll: async ({ catID, page = 1, limit = 10 }: {
        catID?: number;
        page?:  number;
        limit?: number;
    }): Promise<Attraction[]> => {
        const offset = (page - 1) * limit;
        const [rows] = await pool.query(`
            SELECT
                a.attrID,
                a.title,
                a.descr,
                a.location,
                a.basePrice,
                c.catName,
                m.mediaPath,
                m.mediaType,
                m.alt
            FROM attraction a
            JOIN attrcategory c ON a.catID = c.catID
            LEFT JOIN attrmedia m ON a.attrID = m.attrID
                AND m.displayOrder = 0
            WHERE (? IS NULL OR a.catID = ?)
            LIMIT ? OFFSET ?
        `, [catID ?? null, catID ?? null, limit, offset]);
        return rows as Attraction[];
    },

    findByID: async (attrID: number): Promise<Attraction | null> => {
        const [rows] = await pool.query(`
            SELECT
                a.attrID,
                a.title,
                a.descr,
                a.location,
                a.basePrice,
                c.catName,
                m.mediaPath,
                m.mediaType,
                m.alt
            FROM attraction a
            JOIN attrcategory c ON a.catID = c.catID
            LEFT JOIN attrmedia m ON a.attrID = m.attrID
                AND m.displayOrder = 0
            WHERE a.attrID = ?
        `, [attrID]);
        const results = rows as Attraction[];
        return results[0] || null;
    },

    create: async (data: {
        title:     string;
        descr:     string;
        catID:     number;
        location:  string;
        basePrice: number;
    }): Promise<number> => {
        const [result] = await pool.query(`
            INSERT INTO attraction (title, descr, catID, location, basePrice)
            VALUES (?, ?, ?, ?, ?)
        `, [data.title, data.descr, data.catID, data.location, data.basePrice]);
        return (result as any).insertId;
    },

    update: async (attrID: number, data: {
        title:     string;
        descr:     string;
        catID:     number;
        location:  string;
        basePrice: number;
    }): Promise<void> => {
        await pool.query(`
            UPDATE attraction
            SET title = ?, descr = ?, catID = ?, location = ?, basePrice = ?
            WHERE attrID = ?
        `, [data.title, data.descr, data.catID, data.location, data.basePrice, attrID]);
    },

    patch: async (attrID: number, fields: Partial<Attraction>): Promise<void> => {
        const entries = Object.entries(fields);
        if (entries.length === 0) return;

        const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
        const values    = entries.map(([, val]) => val);

        await pool.query(
            `UPDATE attraction SET ${setClause} WHERE attrID = ?`,
            [...values, attrID]
        );
    },

    remove: async (attrID: number): Promise<void> => {
        await pool.query(`
            DELETE FROM attraction WHERE attrID = ?
        `, [attrID]);
    }

};

export default AttractionRepository;
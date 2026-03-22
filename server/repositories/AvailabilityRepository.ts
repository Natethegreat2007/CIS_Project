import pool               from '../db';
import { Availability }   from '../types';

const AvailabilityRepository = {

    findByTour: async (tourID: number): Promise<Availability[]> => {
        const [rows] = await pool.query(`
            SELECT availabilityID, date, slots
            FROM availability
            WHERE tourID = ?
            ORDER BY date ASC
        `, [tourID]);
        return rows as Availability[];
    },

    create: async (data: {
        tourID: number;
        date:   string;
        slots:  number;
    }): Promise<number> => {
        const [result] = await pool.query(`
            INSERT INTO availability (tourID, date, slots)
            VALUES (?, ?, ?)
        `, [data.tourID, data.date, data.slots]);
        return (result as any).insertId;
    },

    update: async (availabilityID: number, slots: number): Promise<void> => {
        await pool.query(`
            UPDATE availability SET slots = ? WHERE availabilityID = ?
        `, [slots, availabilityID]);
    }

};

export default AvailabilityRepository;
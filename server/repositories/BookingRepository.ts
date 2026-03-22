import pool          from '../db';
import { Booking }   from '../types';

const BookingRepository = {

    findByUser: async (userID: number): Promise<Booking[]> => {
        const [rows] = await pool.query(`
            SELECT
                b.bookingID,
                b.userID,
                b.tourID,
                b.tourDate,
                b.personCount,
                b.price,
                b.status,
                b.bookingDate  AS bookedAt,
                t.title        AS tourName,
                a.title        AS attraction,
                a.location,
                p.method       AS paymentMethod
            FROM booking b
            JOIN tour       t ON b.tourID  = t.tourID
            JOIN attraction a ON t.attrID  = a.attrID
            LEFT JOIN payment p ON b.bookingID = p.bookingID
            WHERE b.userID = ?
            ORDER BY b.bookingDate DESC
        `, [userID]);
        return rows as Booking[];
    },

    findAll: async (): Promise<Booking[]> => {
        const [rows] = await pool.query(`
            SELECT
                b.bookingID,
                b.userID,
                b.tourID,
                b.tourDate,
                b.personCount,
                b.price,
                b.status,
                b.bookingDate  AS bookedAt,
                t.title        AS tourName,
                a.title        AS attraction,
                a.location,
                p.method       AS paymentMethod,
                u.fName,
                u.lName
            FROM booking b
            JOIN tour       t ON b.tourID     = t.tourID
            JOIN attraction a ON t.attrID     = a.attrID
            JOIN users      u ON b.userID     = u.userID
            LEFT JOIN payment p ON b.bookingID = p.bookingID
            ORDER BY b.bookingDate DESC
        `);
        return rows as Booking[];
    },

    findByID: async (bookingID: number): Promise<Booking | null> => {
        const [rows] = await pool.query(`
            SELECT
                b.bookingID,
                b.userID,
                b.tourID,
                b.tourDate,
                b.personCount,
                b.price,
                b.status,
                b.bookingDate AS bookedAt
            FROM booking b
            WHERE b.bookingID = ?
        `, [bookingID]);
        const results = rows as Booking[];
        return results[0] || null;
    },

    create: async (data: {
        userID:      number;
        tourID:      number;
        tourDate:    string;
        personCount: number;
        price:       number;
        status:      string;
    }): Promise<number> => {
        const [result] = await pool.query(`
            INSERT INTO booking (userID, tourID, tourDate, personCount, price, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [data.userID, data.tourID, data.tourDate,
            data.personCount, data.price, data.status]);
        return (result as any).insertId;
    },

    updateStatus: async (bookingID: number, status: string): Promise<void> => {
        await pool.query(`
            UPDATE booking SET status = ? WHERE bookingID = ?
        `, [status, bookingID]);
    },

    createWithTransaction: async (data: {
        userID:        number;
        tourID:        number;
        tourDate:      string;
        personCount:   number;
        price:         number;
        paymentMethod: string;
    }): Promise<{ conflict: boolean; bookingID?: number }> => {
        const conn = await (pool as any).getConnection();
        try {
            await conn.beginTransaction();
            await conn.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');

            const [avail] = await conn.query(`
                SELECT slots FROM availability
                WHERE tourID = ? AND date = ?
                FOR UPDATE
            `, [data.tourID, data.tourDate]);

            const slots = (avail as any[])[0]?.slots;
            if (slots === undefined || slots < data.personCount) {
                await conn.rollback();
                return { conflict: true };
            }

            const [bookingResult] = await conn.query(`
                INSERT INTO booking (userID, tourID, tourDate, personCount, price, status)
                VALUES (?, ?, ?, ?, ?, 'Pending')
            `, [data.userID, data.tourID, data.tourDate, data.personCount, data.price]);

            const bookingID = (bookingResult as any).insertId;

            await conn.query(`
                INSERT INTO payment (bookingID, amount, method, success)
                VALUES (?, ?, ?, FALSE)
            `, [bookingID, data.price, data.paymentMethod]);

            await conn.query(`
                UPDATE availability SET slots = slots - ?
                WHERE tourID = ? AND date = ?
            `, [data.personCount, data.tourID, data.tourDate]);

            await conn.commit();
            return { conflict: false, bookingID };

        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

};

export default BookingRepository;
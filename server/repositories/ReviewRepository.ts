import pool         from '../db';
import { Review }   from '../types';

const ReviewRepository = {

    findByTour: async (tourID: number): Promise<{
        avgRating: number | null;
        total:     number;
        data:      Review[];
    }> => {
        const [rows] = await pool.query(`
            SELECT
                r.reviewID,
                r.rating,
                r.comment,
                r.createdAt,
                CONCAT(u.fName, ' ', u.lName) AS userName
            FROM review r
            JOIN users u ON r.userID = u.userID
            WHERE r.tourID = ?
            ORDER BY r.createdAt DESC
        `, [tourID]);

        const reviews = rows as Review[];

        const [avgRows] = await pool.query(`
            SELECT ROUND(AVG(rating), 1) AS avgRating, COUNT(*) AS total
            FROM review WHERE tourID = ?
        `, [tourID]);

        const stats = (avgRows as any[])[0];
        return {
            avgRating: stats.avgRating,
            total:     stats.total,
            data:      reviews
        };
    },

    findByUserAndTour: async (userID: number, tourID: number): Promise<Review | null> => {
        const [rows] = await pool.query(`
            SELECT reviewID FROM review
            WHERE userID = ? AND tourID = ?
        `, [userID, tourID]);
        const results = rows as Review[];
        return results[0] || null;
    },

    create: async (data: {
        userID:  number;
        tourID:  number;
        rating:  number;
        comment: string;
    }): Promise<number> => {
        const [result] = await pool.query(`
            INSERT INTO review (userID, tourID, rating, comment)
            VALUES (?, ?, ?, ?)
        `, [data.userID, data.tourID, data.rating, data.comment]);
        return (result as any).insertId;
    }

};

export default ReviewRepository;
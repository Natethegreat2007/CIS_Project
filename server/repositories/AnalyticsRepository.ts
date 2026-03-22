import pool from '../db';

const AnalyticsRepository = {

    getSummary: async () => {
        const [userRows] = await pool.query(`
            SELECT COUNT(*) AS totalUsers
            FROM users u
            JOIN role r ON u.roleID = r.roleID
            WHERE r.roleName IN ('Tourist', 'Operator')
            AND u.active = TRUE
        `);

        const [bookingRows] = await pool.query(`
            SELECT COUNT(*) AS totalBookings FROM booking
        `);

        const [tourRows] = await pool.query(`
            SELECT
                t.tourID,
                t.title,
                COUNT(b.bookingID) AS bookingCount
            FROM tour t
            LEFT JOIN booking b ON t.tourID = b.tourID
            GROUP BY t.tourID
            ORDER BY bookingCount DESC
            LIMIT 4
        `);

        return {
            totalUsers:    (userRows    as any[])[0].totalUsers,
            totalBookings: (bookingRows as any[])[0].totalBookings,
            popularTours:  tourRows
        };
    },

    getBookings: async () => {
        const [byNationality] = await pool.query(`
            SELECT
                n.cName AS country,
                COUNT(b.bookingID) AS bookingCount
            FROM booking b
            JOIN users      u ON b.userID = u.userID
            JOIN nationality n ON u.natID = n.natID
            GROUP BY n.natID
            ORDER BY bookingCount DESC
        `);

        const [bySeason] = await pool.query(`
            SELECT
                CASE
                    WHEN MONTH(b.tourDate) IN (12,1)   THEN 'Peak'
                    WHEN MONTH(b.tourDate) IN (6,7,8)  THEN 'Off-Peak'
                    ELSE 'Standard'
                END AS season,
                COUNT(*)    AS bookingCount,
                SUM(b.price) AS revenue
            FROM booking b
            GROUP BY season
        `);

        const [byMonth] = await pool.query(`
            SELECT
                MONTHNAME(b.tourDate) AS month,
                COUNT(*) AS bookingCount
            FROM booking b
            GROUP BY MONTH(b.tourDate), MONTHNAME(b.tourDate)
            ORDER BY MONTH(b.tourDate)
        `);

        return { byNationality, bySeason, byMonth };
    }

};

export default AnalyticsRepository;
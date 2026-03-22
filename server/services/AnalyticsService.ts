import AnalyticsRepository from '../repositories/AnalyticsRepository';

const AnalyticsService = {

    getSummary: async () => {
        return await AnalyticsRepository.getSummary();
    },

    getBookings: async () => {
        return await AnalyticsRepository.getBookings();
    }

};

export default AnalyticsService;
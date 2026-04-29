import ReviewRepository from '../repositories/ReviewRepository';

const ReviewService = {

    getForTour: async (tourID: number) => {
        return await ReviewRepository.findByTour(tourID);
    },

    submit: async (data: {
        userID:  number;
        tourID:  number;
        rating:  number;
        comment: string;
    }): Promise<{ ok: boolean; status: number; reviewID?: number; error?: string }> => {
        const existing = await ReviewRepository.findByUserAndTour(data.userID, data.tourID);
        if (existing) return { ok: false, status: 409, error: 'Already reviewed this tour.' };

        if (data.rating < 1 || data.rating > 5) {
            return { ok: false, status: 400, error: 'Rating must be between 1 and 5.' };
        }

        const reviewID = await ReviewRepository.create(data);
        return { ok: true, status: 201, reviewID };
    }

};

export default ReviewService;
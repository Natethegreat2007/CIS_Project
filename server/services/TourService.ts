import TourRepository from '../repositories/TourRepository';
import { Tour }        from '../types';

const TourService = {

    getAll: async ({ attrID, page = 1, limit = 10 }: {
        attrID?: number|undefined;
        page?:   number;
        limit?:  number;
    }): Promise<Tour[]> => {
        return await TourRepository.findAll({ attrID, page, limit });
    },

    getByID: async (tourID: number): Promise<Tour | null> => {
        return await TourRepository.findByID(tourID);
    },

    create: async (data: {
        attrID:      number;
        operatorID:  number;
        title:       string;
        duration:    number;
        price:       number;
        maxCap:      number;
    }): Promise<number> => {
        return await TourRepository.create(data);
    },

    update: async (
        tourID:     number,
        operatorID: number,
        data:       Partial<Tour>
    ): Promise<{ ok: boolean; status: number; error?: string }> => {
        const tour = await TourRepository.findByID(tourID);
        if (!tour) return { ok: false, status: 404, error: 'Tour not found.' };
        if (tour.operatorID !== operatorID) {
            return { ok: false, status: 403, error: 'Forbidden.' };
        }
        await TourRepository.update(tourID, data);
        return { ok: true, status: 200 };
    },

    patch: async (
        tourID:     number,
        operatorID: number,
        fields:     Partial<Tour>
    ): Promise<{ ok: boolean; status: number; error?: string }> => {
        const tour = await TourRepository.findByID(tourID);
        if (!tour) return { ok: false, status: 404, error: 'Tour not found.' };
        if (tour.operatorID !== operatorID) {
            return { ok: false, status: 403, error: 'Forbidden.' };
        }
        await TourRepository.patch(tourID, fields);
        return { ok: true, status: 200 };
    },

    remove: async (
        tourID:     number,
        operatorID: number
    ): Promise<{ ok: boolean; status: number; error?: string }> => {
        const tour = await TourRepository.findByID(tourID);
        if (!tour) return { ok: false, status: 404, error: 'Tour not found.' };
        if (tour.operatorID !== operatorID) {
            return { ok: false, status: 403, error: 'Forbidden.' };
        }
        await TourRepository.remove(tourID);
        return { ok: true, status: 200 };
    }

};
export default TourService;
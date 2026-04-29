import AvailabilityRepository from '../repositories/AvailabilityRepository';
import { Availability }        from '../types';

const AvailabilityService = {

    getForTour: async (tourID: number): Promise<Availability[]> => {
        return await AvailabilityRepository.findByTour(tourID);
    },

    create: async (data: {
        tourID: number;
        date:   string;
        slots:  number;
    }): Promise<{ ok: boolean; status: number; availabilityID?: number; error?: string }> => {
        try {
            const availabilityID = await AvailabilityRepository.create(data);
            return { ok: true, status: 201, availabilityID };
        } catch (err: any) {
            // duplicate entry — composite unique key (tourID, date) violated
            if (err.code === 'ER_DUP_ENTRY') {
                return { ok: false, status: 409, error: 'Date already exists for this tour.' };
            }
            throw err;
        }
    },

    update: async (
        availabilityID: number,
        slots:          number
    ): Promise<{ ok: boolean; status: number; error?: string }> => {
        if (slots < 0) return { ok: false, status: 400, error: 'Slots cannot be negative.' };
        await AvailabilityRepository.update(availabilityID, slots);
        return { ok: true, status: 200 };
    }

};

export default AvailabilityService;
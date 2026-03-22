import OperatorRepository from '../repositories/OperatorRepository';
import { Operator }        from '../types';

const OperatorService = {

    getAll: async (): Promise<Operator[]> => {
        return await OperatorRepository.findAll();
    },

    getTours: async (operatorID: number) => {
        return await OperatorRepository.findTours(operatorID);
    },

    update: async (
        operatorID: number,
        data:       Partial<Operator>
    ): Promise<{ ok: boolean; status: number; error?: string }> => {
        const existing = await OperatorRepository.findByID(operatorID);
        if (!existing) return { ok: false, status: 404, error: 'Operator not found.' };
        await OperatorRepository.update(operatorID, data);
        return { ok: true, status: 200 };
    }

};

export default OperatorService;
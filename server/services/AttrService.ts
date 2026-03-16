import AttractionRepository from "../repositories/AttrRepository";
import {Attraction} from "../types";
import AttractionController from "../controllers/AttractionController";

const AttrService = {
    getAll: async({catID, page, limit}:{
        catID?:number;
        page?:number;
        limit?:number;
    }):Promise<Attraction[]>=>{
        return await AttractionRepository.findAll({catID, page, limit})
    },

    getByID: async(attrID:number):Promise<Attraction|null> =>{
        return await AttractionRepository.findByID(attrID);
    },
    create: async(data:{
        title:string;
        descr:string;
        catID:number;
        location:string;
        basePrice:number;
    }): Promise<number> =>{
        return await AttractionRepository.create(data);
    },
    update: async(attrID:number, data:{
        title:string;
        descr:string;
        catID:number;
        location:string;
        basePrice:number;
    }): Promise<{ok: boolean; status: number; error?: string}> =>{
        const existing = await AttractionRepository.findByID(attrID);
        if(!existing) return {ok: false, status: 404, error: 'Attraction not found.'};
        await AttractionRepository.update(attrID, data);
        return {ok: true, status: 200};
    },
    patch: async(attrID:number, data:{
        title?:string;
        descr?:string;
        catID?:number;
        location?:string;
        basePrice?:number;
    }):Promise<{ok: boolean; status: number; error?: string}> => {
        const existing = await AttractionRepository.findByID(attrID);
        if(!existing) return {ok: false, status: 404, error: 'Attraction not found.'};
        await AttractionRepository.patch(attrID, data);
        return {ok: true, status: 200};
    },
    remove: async(attrID:number):Promise<{ok: boolean; status: number; error?: string}> =>{
        const existing = await AttractionRepository.findByID(attrID);
        if(!existing) return {ok: false, status: 404, error: 'Attraction not found.'};
        await AttractionRepository.remove(attrID);
        return {ok: true, status: 200};
    }
}

export default AttrService;
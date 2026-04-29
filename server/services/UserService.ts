import UserRepository from "../repositories/UserRepository";
import {User} from "../types";

export const UserService ={
    getAll: async({userID, page, limit}: {
        userID?: number;
        page?: number;
        limit?: number}):Promise<User[]>=>{

        return await UserRepository.findAll({
            userID, page, limit
        });
    },
    getByID: async(userID:number|undefined):Promise<User|null> =>{
        return await UserRepository.findByID(userID);
    },
    patch: async(userID:number|undefined, fields:Partial<User>):Promise<void> =>{
        return await UserRepository.patch(userID, fields);
    },
    setActive: async(userID:number|undefined, active: boolean):Promise<void> =>{
        return await UserRepository.setActive(userID, active);
    },
    deactivate: async(userID:number|undefined):Promise<void> =>{
        return await UserRepository.deactivate(userID);
    },
    setRole: async(userID:number|undefined, role:string):Promise<void> =>{
        return await UserRepository.setRole(userID, role);
    }
}
import {Request, Response} from 'express';
import {UserService} from "../services/UserService";

const UserController = {
    getAll: async(req: Request, res: Response):Promise<void>=>{
        try{
            const {userID, page, limit} = req.query;
            const data = await UserService.getAll(
                {
                    userID: userID as number | undefined,
                    page: Number(page) | 1,
                    limit: Number(limit) | 10
                });

            res.status(200).json(data);
        }catch(err){
            res.status(500).json({error:'Server Error.'});
        }
    },
    getOne: async(req: Request, res: Response):Promise<void>=>{
        try{
            const id = Number(req.params.id);
            const user = UserService.getByID(id);
            if(!user){
                res.status(404).json({error:'User not found.'});
                return;
            }
        } catch (err){
            res.status(500).json({error:'Server Error.'});
        }
    },
    updatePartial: async(req: Request, res: Response): Promise<void> =>{
        try{
            const id = Number(req.params.id);
            const fields = req.body ;
            await UserService.patch(id, fields);
            res.status(200).json({message:'User updated.'});
        }catch(err){
            res.status(500).json({error:'Server Error.'});
        }
    },
    deactivate: async(req: Request, res: Response): Promise<void> =>{
        try{
            const userId = req.user?.id;
            await UserService.deactivate(userId);
            res.status(200).json({message:'User deactivated.'});
        } catch(err){
            res.status(500).json({error:'Server Error.'});
        }
    },

    suspend: async(req: Request, res: Response): Promise<void> =>{
        try{
            const id = Number(req.params.id);
            await UserService.setActive(id, false);
            res.status(200).json({message:'User status updated: User is suspended.'});
        }catch(err){
            res.status(500).json({error:'Server Error.'});
        }
    },
    activate: async(req: Request, res: Response): Promise<void> =>{
        try{
            const id = Number(req.params.id);
            await UserService.setActive(id, true);
            res.status(200).json({message:`User status updated: active.`});
        }catch(err){
            res.status(500).json({error:'Server Error.'});
        }
    },
    changeRole: async(req: Request, res: Response): Promise<void> =>{
        try{
            const id = Number(req.params.id);
            const {role} = req.body;
            if(!['Admin', 'Operator', 'Tourist'].includes(role)){
                res.status(400).json({error:'Invalid role.'});
                return;
            }
            await UserService.setRole(id, role);
            res.status(200).json({message:'User role updated.'});
        } catch (err){
            res.status(500).json({error:'Server Error.'});
        }
    }
}

export default UserController;
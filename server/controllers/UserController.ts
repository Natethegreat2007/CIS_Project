import {Request, Response} from 'express';

const UserController = {
    getAll: async(req: Request, res: Response):Promise<void>=>{
        try{
            //TODO: const {userID, page, limit} = req.query;
            //TODO: UserService.getAll()
            const data = [
                {userID:1, email:'<EMAIL>', fName:'Nathan', lName:'Scott'},
                {userID:2, email:'<EMAIL>', fName:'Nicole', lName:'Burke'},
            ]
            res.status(200).json(data);
        }catch(err){
            res.status(500).json({error:'Server Error.'});
        }
    },
    getOne: async(req: Request, res: Response):Promise<void>=>{
        try{
            const id = Number(req.params.id);
            const user = {userID:id, email:'<EMAIL>', fName:'Nathan', lName:'Scott'};
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
            //TODO: UserService.patch(id, fields);
            res.status(200).json({message:'User updated.'});
        }catch(err){
            res.status(500).json({error:'Server Error.'});
        }
    },
    deactivate: async(req: Request, res: Response): Promise<void> =>{
        const id = Number(req.params.id);
        const userId = req.user?.id;
        //TODO: UserService.deactivate(id, userId);

        res.status(200).json({message:'User deactivated.'});
    },

    suspend: async(req: Request, res: Response): Promise<void> =>{
        try{
            const id = Number(req.params.id);
            //TODO: UserService.suspend(id);
            res.status(200).json({message:'User suspended.'});
        }catch(err){
            res.status(500).json({error:'Server Error.'});
        }
    },
    activate: async(req: Request, res: Response): Promise<void> =>{
        try{
            const id = Number(req.params.id);
            //TODO: UserService.activate(id);
            res.status(200).json({message:'User activated.'});
        }catch(err){
            res.status(500).json({error:'Server Error.'});
        }
    },
    changeRole: async(req: Request, res: Response): Promise<void> =>{
        try{
            const id = Number(req.params.id);
            const {role} = req.body;
            //TODO: UserService.roleSet(id, role);
            if(!['Admin', 'Operator', 'Tourist'].includes(role)){
                res.status(400).json({error:'Invalid role.'});
                return;
            }
            res.status(200).json({message:'User role updated.'});
        } catch (err){
            res.status(500).json({error:'Server Error.'});
        }
    }
}

export default UserController;
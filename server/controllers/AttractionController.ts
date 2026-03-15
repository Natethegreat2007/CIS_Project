import { Request, Response } from "express";

const AttractionController = {
    //CREATE
    create: async(req: Request, res: Response): Promise<void> =>{
      try{
          const body = req.body;
          //const attrID = AttrService.create(body)
          res.status(201).json({attrID: 99, message:'Attraction created.'});
      }catch(err){
          res.status(500).json({error:'Server Error.'});
      }
    },
    //READ
    getAll: async(req: Request, res: Response): Promise<void> =>
    {
        try{
           // const {catID, page, limit} = req.query;
            //AttrService.getAll()
            const data = [
                {attrID:1, title: 'Xunantunich', location: 'Cayo District'},
                {attrID:2, title: 'Belize Barrier Reef', location: 'Caribbean Sea'}
            ]
            res.status(200).json(data);
        }catch(err){
            res.status(500).json({error:'Server Error.'});
        }
    },
    getOne: async(req: Request, res: Response): Promise<void> =>{
        try{
            const id = Number(req.params.id);
            const attraction = {attrID:id, title: 'Xunantunich', location: 'Cayo District'};
            if(!attraction){
                res.status(404).json({error:'Attraction not found.'});
                return;
            }
        } catch (err){
            res.status(500).json({error:'Server Error.'});
        }
    },
    //UPDATE
    update: async(req: Request, res: Response): Promise<void> =>{
        try{
            const id = Number(req.params.id);
            const body = req.body;
            //AttrService.update(id, body)
            res.status(200).json({message:'Attraction updated.'});
        }catch(err){
            res.status(500).json({error:'Server Error.'});
        }
    },
    //PATCH
    updatePartial: async(req: Request, res: Response): Promise<void> =>{
        const id = Number(req.params.id);
        const fields = req.body;
        //AttrService.patch(id, fields);
        res.status(200).json({message:'Attraction fields updated.'});
    },
    //DELETE
    remove: async(req: Request, res: Response): Promise<void> =>{
        try{
            const id = Number(req.params.id);
            //AttrService.remove(id);
            res.status(200).json({message:'Attraction deleted.'});
        }catch(err) {
            res.status(500).json({error: 'Server Error.'});
        }
    }
}
export default AttractionController;
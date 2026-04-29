import {Router} from "express";
import AttractionController from "../controllers/AttractionController";
import authenticate from "../middleware/authenticate";
import authorize from "../middleware/authorize";
const router = Router();

// Route for creating a new attraction
router.post("/", authenticate, authorize('Admin'),AttractionController.create);
// Route for fetching all attractions
router.get("/", AttractionController.getAll);
// Route for fetching a single attraction by ID
router.get("/:id", AttractionController.getOne);
// Route for updating an attraction by ID
router.put("/:id", AttractionController.update);
// Route for field update
router.patch("/:id", authenticate, authorize('Admin'), AttractionController.updatePartial);
// Route for deleting an attraction by ID
router.delete("/:id", authenticate, authorize('Admin'), AttractionController.remove);

export default router;

// server/types/express.d.ts
import { JWTPayload } from './index';

declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}
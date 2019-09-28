import * as express from 'express';
import * as jwt from 'jsonwebtoken';
import {AbstractController, LogLevels} from './AbstractController';
import {ServiceError} from '../error/ServiceError';

export class JWTController extends AbstractController {
    protected async processRequest(req: express.Request, res: express.Response): Promise<any> {
        // log request received
        await super.processRequest(req, res);

        let header: string = process.env.JWT_HEADER || 'authorization';
        header = header.toLowerCase();
        // allow case insensitive header names
        const headerValue: string | string[] = req.headers[Object.keys(req.headers).find(key => key.toLowerCase() === header)];
        let token: string | string[] = null;

        if (!headerValue) {
            const error: ServiceError = new ServiceError('No token provided.', 403);
            this.log(LogLevels.ERROR, error.message, null, req, error);
            throw error;
        }

        // extract authentication type by splitting
        // auth header format: <type> <credentials>
        const valueParts = (headerValue as string).split(' ');

        if (valueParts.length !== 2) {
            const error: ServiceError = new ServiceError('Invalid authorization header format.', 403);
            this.log(LogLevels.ERROR, error.message, null, req, error);
            throw error;
        }

        // you can add additional auth types as needed
        switch (valueParts[0]) {
            case 'Bearer':
                token = valueParts[1];
                break;
            default:
                const error: ServiceError = new ServiceError('Unsupported authentication type.', 403);
                this.log(LogLevels.ERROR, error.message, null, req, error);
                throw error;
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // attach token to the request
            req['token'] = decoded;

            // return decoded
            return decoded;
        } catch (e) {
            const error: ServiceError = new ServiceError('Failed to authenticate token.', 401);
            this.log(LogLevels.ERROR, error.message, null, req, error);
            throw error
        }
    }
    // override and call next to proceed with request
    protected next(req: express.Request, res: express.Response, next: (e?) => {}, result: any): void {
        next();
    }
    // stub for override
    protected getSegmentName(): string {
        return 'JWTController';
    }
}

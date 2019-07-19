import {AbstractController} from './AbstractController';
import * as express from 'express';
import {LogLevels} from './AbstractController';
import {FilterXSS} from 'xss';
import {ServiceError} from '../error/ServiceError';

export class XSSController extends AbstractController {

    protected readonly xssConfig: object = {};

    public constructor(xssConfig: object = {}) {
        super();
        this.xssConfig = xssConfig;
    }

    protected async processRequest(req: express.Request, res: express.Response): Promise<any> {
        // log request recieved
        this.log(LogLevels.INFO, 'Request recieved', null, req);

        return new Promise<any>((resolve, reject) => {
            try {
                const xss = new FilterXSS(this.xssConfig);
                req.body = (req.body) ? JSON.parse(xss.process(JSON.stringify(req.body))) : req.body;
                return this.resolvePromise(req.body, resolve, reject, null, null);
            } catch (e) {
                const error: ServiceError = new ServiceError('Payload is invalid', 400);
                this.log(LogLevels.ERROR, error.message, null, req, e);
                return this.resolvePromise(null, resolve, reject, error, null);
            }
        });
    }

    // override and call next to proceed with request
    protected next(req: express.Request, res: express.Response, next: (e?) => {}, result: any): void {
        next();
    }

    protected getSegmentName(): string {
        return 'XSSController';
    }
}

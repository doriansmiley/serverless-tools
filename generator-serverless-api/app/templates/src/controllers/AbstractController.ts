import * as express from 'express';
import * as AWSXRay from 'aws-xray-sdk';
import {validate, ValidationOptions, ValidationResult as JoiValidationResult} from 'joi';
import {ServiceError} from '../error/ServiceError';
import {UuidUtils} from '../util/UuidUtils';
import {Config} from '../core/Config';
import {Context} from '../core/Context';
import { object } from 'joi';
import {RequestHandler} from 'express';

export enum LogLevels {
    LOG = 'LOG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR'
}

export abstract class AbstractController {

    protected async processRequest(req: express.Request, res: express.Response): Promise<any> {
        // log request received
        this.log(LogLevels.INFO, this.getSegmentName() + ' Request received', null, req);
        try {
            // first validate the incoming request.
            this.checkValidation(req);

            // stub for override
            // in your sub classes you should supply value for result and error
            return null;
        } catch (e) {
            // log error response
            this.log(LogLevels.ERROR, e.message, null, req, e);
            throw e;
        }
    }

    protected checkValidation(req: express.Request): ServiceError {
        // first validate the incoming request
        const vResult = this.validate(req);
        if (vResult.error !== null) {
            const error = new ServiceError(vResult.error.message, 400);
            this.log(LogLevels.ERROR, vResult.error.message, null, req, error);
            throw error;
        }
        return null;
    }

    protected createContext(): Context {

        return new Context(new Config());
    }

    protected generateTermGUID(): string {
        return UuidUtils.generateUUID();
    }

    public resolveServiceError(e: Error): ServiceError {

        if (e instanceof ServiceError) {
            return e;
        }

        let errorCode = 500;

        if (e instanceof RangeError) {
            errorCode = 400;
        } else {
            // TODO: add exception handling and set error code appropriately
            errorCode = 500;
        }

        return new ServiceError(e.message, errorCode);
    }

    // stub for override
    protected getSegmentName(): string {
        return 'AbstractController';
    }

    // validate the payload
    protected validate(req: express.Request): JoiValidationResult<object> {
        const schema: object = this.getSchema();
        const options: ValidationOptions = this.getOptions();
        return validate<object>(this.getValidationobject(req), schema, options);
    }

    protected getSchema(): object {
        return object({});
    }

    protected getValidationobject(req: express.Request): object {
        return (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') ? req.body : req.params;
    }

    protected getOptions(): ValidationOptions {
        return {
            allowUnknown: true
        };
    }
    // some controllers act as middleware and need to call next while others usually send a response
    // this is an override point for middleware
    protected next(req: express.Request, res: express.Response, next: (e) => void, result: any): void {
        res.json(result);
    }

    protected log(level: LogLevels, message: string, data: object = null, request: express.Request = null, error: Error = null): void {
        console.log({
            logLevel: level,
            message: message,
            data: data,
            request: (request) ? {
                id: request['id'] || null,
                protocol: request.protocol || null,
                method: request.method || null,
                headers: request.headers || null,
                body: request.body || null,
                query: request.query || null,
                params: request.params || null,
                host: request.hostname || null,
                path: request.path || null,
                isXhr: request.xhr || null,
            } : null,
            error: error,
        });
    }

    /*
     The register function wraps our async route handlers in a function so they can be used as express middleware
     Good article here: https://medium.com/@Abazhenov/using-async-await-in-express-with-node-8-b8af872c0016
     It also wraps the processRequest invocation in an XRay subsegment.
     Article here: https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-nodejs-subsegments.html
     Full XRay docs for nodeJS are here: https://docs.aws.amazon.com/xray-sdk-for-nodejs/latest/reference/index.html
     */
    public register(): RequestHandler {
        return (req: express.Request, res: express.Response, next: (e) => void) => {
            // populate request id if it doesn't exist
            req['id'] = (!req.hasOwnProperty('id')) ? UuidUtils.generateUUID() : req['id'];
            AWSXRay.captureAsyncFunc(this.getSegmentName(), (subsegment) => {
                this.processRequest(req, res)
                    .then((result: object) => {
                        this.next(req, res, next, result);
                        subsegment.close();
                    })
                    .catch((e) => {
                        if (e instanceof ServiceError) {
                            res.status((e as ServiceError).status).send((e as ServiceError).message);
                        } else {
                            next(e);
                        }
                        subsegment.close();
                    });
            });
        };
    }
}

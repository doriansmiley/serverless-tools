import {IController} from './IController';
import * as express from 'express';
import * as AWSXRay from 'aws-xray-sdk';
import {validate, ValidationOptions, ValidationResult as JoiValidationResult} from 'joi';
import {ServiceError} from '../error/ServiceError';
import {UuidUtils} from '../util/UuidUtils';
import {PromiseResolver} from '../util/PromiseResolver';
import {Config} from '../core/Config';
import {IConfig} from '../core/IConfig';
import {Context} from '../core/Context';
import { object } from 'joi';

export enum LogLevels {
    LOG = 'LOG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR'
}

export abstract class AbstractController extends PromiseResolver implements IController {
    protected async processRequest(req: express.Request, res: express.Response): Promise<any> {
        // log request recieved
        this.log(LogLevels.INFO, 'Request recieved', null, req);

        return new Promise<object>((resolve, reject) => {
            try {
                // first validate the incoming request.
                const vResult = this.validate(req);
                if (vResult.error !== null) {
                    this.log(LogLevels.ERROR, vResult.error.message, null, req, vResult.error);
                    return this.resolvePromise(null, resolve, reject, new Error(vResult.error.message), null);
                }

                // stub for override
                // in your sub classes you should supply value for result and error
                this.resolvePromise(null, resolve, reject, null, null);
            } catch (e) {
                // log error response
                this.log(LogLevels.ERROR, e.message, null, req, e);
                return this.resolvePromise(null, resolve, reject, e, null);
            }
        });
    }

    protected checkValidation(req: express.Request): ServiceError {
        // first validate the incoming request
        const vResult = this.validate(req);
        if (vResult.error !== null) {
            const error = new ServiceError(vResult.error.message, 400);
            this.log(LogLevels.ERROR, vResult.error.message, null, req, error);
            return error;
        }
        return null;
    }

    protected createContext(): Context {
        // create context
        const config: IConfig = new Config();

        return new Context(config);
    }

    protected generateTermGUID(): string {
        return UuidUtils.generateUUID();
    }

    public resolveServiceError(e: Error): ServiceError {

        if (e instanceof ServiceError){
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
        const schema: Object = this.getSchema();
        const options: ValidationOptions = this.getOptions();
        return validate<Object>(this.getValidationObject(req), schema, options);
    }

    protected getSchema(): object {
        return object({});
    }

    protected getValidationObject(req: express.Request): Object {
        return (req.method === 'POST' || req.method === 'UPDATE' || req.method === 'PATCH') ? req.body : req.params;
    }

    protected getOptions(): ValidationOptions {
        return {
            allowUnknown: true
        };
    }
    // some controllers act as middleware and need to call next while others usually send a response
    // this is an override point for middleware
    protected next(req: express.Request, res: express.Response, next: (e) => {}, result: any): void {
        res.json(result);
    }

    protected log(level: LogLevels,
                  message: string,
                  data: Object = null,
                  request: express.Request = null,
                  error: Error = null): void {
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
    public register(): Function {
        return (req: express.Request, res: express.Response, next: (e) => {}) => {
            // populate request id if it doesn't exist
            req['id'] = (!req.hasOwnProperty('id')) ? UuidUtils.generateUUID() : req['id'];
            AWSXRay.captureAsyncFunc(this.getSegmentName(), (subsegment) => {
                this.processRequest(req, res)
                    .then((result: Object) => {
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

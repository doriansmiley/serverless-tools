import {Config} from '../core/Config';
import {Context} from '../core/Context';
import {ServiceError} from '../error/ServiceError';
import {UuidUtils} from '../util/UuidUtils';
import * as express from 'express';
import {IConfig} from "../core/IConfig";
import {AbstractController} from "./AbstractController"
import {LogLevels} from "./AbstractController"
const debug = require('debug')('<%- apiName %>:controllers');

export class Controller extends AbstractController {

    constructor() {
        super();
    }

    protected checkValidation(req: express.Request): ServiceError {
        // first validate the incoming request
        const vResult = this.validate(req);
        if (vResult.error !== null) {
            const error = new ServiceError(vResult.error.message, 400);
            this.log(LogLevels.ERROR, vResult.error.message, null, req, error);
            return error
        }
        return null;
    }

    protected createContext(): Context {
        // create context
        let config: IConfig = new Config();

        return new Context(config);
    }

    protected generateTermGUID(): string {
        return UuidUtils.generateUUID();
    }

    public resolveServiceError(e: Error): ServiceError {

        let errorCode = 500;

        if (e instanceof RangeError) {
            errorCode = 400;
        } else {
            // TODO: add exception handling and set error code appropriately
            errorCode = 500;
        }

        return new ServiceError(e.message, errorCode);
    }
}

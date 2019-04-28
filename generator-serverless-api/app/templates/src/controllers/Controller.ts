import {Config, Context, IServiceSerializer, InjectionToken, UuidUtils} from '@mfourmobile/mfour-client-sdk';
import {AbstractController, ServiceError, DriverError, SecurityException, LogLevels} from '@mfourmobile/mfour-node-sdk';
import * as express from 'express';
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
            // TODO: pass debug instance as a log function once AbstractController is refactored
            this.log(LogLevels.ERROR, vResult.error.message, null, req, error);
            return error;
        }
        return null;
    }

    protected createContext(): Context {
        // create context
        const config: Config = new Config();

        return new Context(config);
    }

    protected generateTermGUID(): string {
        return UuidUtils.generateUUID();
    }

    public getSerializer(context: Context): IServiceSerializer {
        return context.injector.inject(InjectionToken.SERVICE_SERIALIZER) as IServiceSerializer;
    }

    public resolveServiceError(e: Error): ServiceError {

        let errorCode = 500;

        if (e instanceof RangeError) {
            errorCode = 400;
        } else if (e instanceof DriverError) {
            switch (e.message) {
                case DriverError.FILE_NOT_FOUND:
                    errorCode = 404;
                    break;
                case DriverError.UNDEFINED_ARTIFACT_FILE_NAME:
                case DriverError.INVALID_ARTIFACT_FILE_INSTANCE_TYPE:
                case DriverError.UNDEFINED_ARTIFACT_TYPE:
                case DriverError.INVALID_ARTIFACT_INSTANCE_TYPE:
                case DriverError.UNSUPPORTED_ARTIFACT_TYPE:
                case DriverError.INVALID_ARTIFACT_FILE_NAME:
                    errorCode = 400;
                    break;
            }
        } else if (e instanceof SecurityException) {
            switch (e.message) {
                case SecurityException.NOT_AUTHORIZED:
                    errorCode = 401;
                    break;
            }
        }

        return new ServiceError(e.message, errorCode);
    }
}

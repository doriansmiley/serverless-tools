import {ServiceError, SecurityException} from '@mfourmobile/mfour-node-sdk';
import {IServiceSerializer} from '@mfourmobile/mfour-client-sdk';
import { object, array, number, string, validate, ValidationOptions, ValidationResult as JoiValidationResult } from 'joi';
import * as express from 'express';
import {Controller} from './Controller';
import {LogLevels} from '@mfourmobile/mfour-node-sdk';
import {ServiceContext} from '@mfourmobile/mfour-client-sdk';
const debug = require('debug')('<%- apiName %>:controllers');

import * as util from 'util';

export class <%- className %> extends Controller {

    constructor() {
        super();
    }

    protected async processRequest(req: express.Request, res: express.Response): Promise<any> {
        try {
            // TODO: pass debug instance as a log function once AbstractController is refactored
            this.log(LogLevels.INFO, '<%- className %> Request received', null, req);
            this.log(LogLevels.INFO, '<%- className %>.processRequest: ' + JSON.stringify(req.body));

            // first validate the incoming request
            const error: ServiceError = this.checkValidation(req);
            if (error !== null ) {
                throw error;
            }

            const json: any = null;

            // get clientId from JWT
            if (!req.hasOwnProperty('token') || !req.token.hasOwnProperty('clientId')) {
                throw new ServiceError('ClientId was not found in token', 400);
            }

            const tokenClientId: string = req.token.clientId;

            if (typeof tokenClientId !== 'string' || tokenClientId.length === 0) {
                throw new SecurityException('ClientId found in token is invalid');
            }

            // create context
            const context: ServiceContext = this.createContext();

            // get a reference to service serializer.
            const serializer: IServiceSerializer = this.getSerializer(context);

            // TODO: code out your controller logic, be sure to pass context to your business objects.
            // This makes your code threadsafe when accessing service objects
            // always access service objects via the context

            // TODO: set JSON to return
            return {
                tmp: 'someValue'
            };
        } catch (e) {
                throw this.resolveServiceError(e);
            }
    }

    // This function should match route route controller's http verb
    protected getSegmentName(): string {
        return 'Create';
    }

    protected getSchema(): object {
        // TODO: add you schema validation.
        // This is called by AbstractController.validate and is run against req.body
        // you can also override the AbstractController.getOptions which returns the schema options
        // for more information see joi validation and schema options
        return object({
            // id: string().required(),
            // someValue: string().required()
        });
    }
}

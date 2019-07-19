import {ServiceError} from '../error/ServiceError';
import {SecurityException} from '../error/SecurityException';
import {LogLevels} from './AbstractController';
import {IContext} from '../core/IContext';
import { validate, ValidationOptions, ValidationResult as JoiValidationResult, object } from 'joi';
import * as express from 'express';
import {AbstractController} from './AbstractController';

export class <%- className %> extends AbstractController {

    public constructor() {
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

            // create context
            const context: IContext = this.createContext();

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

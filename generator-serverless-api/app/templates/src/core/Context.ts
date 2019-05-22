import {IContext} from './IContext';
import {IConfig} from './IConfig';

/*
* The Context class is used to sandbox individual requests. It can be expanded to include things like
* injectors, a central event bus, command mapping, etc
* */
export class Context implements IContext {
    private _config: IConfig;

    constructor (config: IConfig) {
        this._config = config;
    }


    get config(): IConfig {
        return this._config;
    }
}

import {Config} from './Config';

/*
* The Context class is used to sandbox individual requests. It can be expanded to include things like
* injectors, a central event bus, command mapping, etc
* */
export class Context {
    private _config: Config;

    public constructor (config: Config) {
        this._config = config;
    }


    public get config(): Config {
        return this._config;
    }
}

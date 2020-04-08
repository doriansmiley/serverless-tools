import {StringUtils} from '../util/StringUtils';

export class Config {

    protected _serviceMap: object = null; // hash to look up routes

    public baseUrl: string; // base http address of application ie http://localhost:3000. Note DO NOT include the trailing /.
    public webRoot = ''; // path relative to webroot where the application is deployed
    public token: string = null; // used for oAuth authentication schemes and similar token based authentication systems
    // used for assigning a concrete service implementation. Must be in the form: /v + version number. for example: /v1
    public serviceCode: string = null;

    public constructor() {
        this.init();
    }

    protected init(): void {
        // TODO: add your service maps, this is used for basic microservice discovery and resolution
        this._serviceMap = {
            /* example definition, note the use of route params
            someApi: {
                baseURL: 'https://url',
                port: 'somePort',
                create:  '/noun',
                update: '/noun',
                delete: '/noun/{0}',
                read: '/noun/{0}/{1}/{2}'
            }
            */
        };
        this.serviceCode = '/v1';
    }

    public get serviceMap(): object {
        return this._serviceMap;
    }

    public getURLWithParams(serviceName: string, route: string, args?: string[]): string {
        return this.serviceCode + StringUtils.substitute(this.serviceMap[serviceName][route], args);
    }

    public getAbsoluteURLWithParams(serviceName: string, route: string, args?: string[]): string {
        let baseURL: string = this.serviceMap[serviceName]['baseURL'];
        if (this.serviceMap[serviceName]['port']) {
            baseURL += ':' + this.serviceMap[serviceName]['port'];
        }
        baseURL += this.serviceCode + StringUtils.substitute(this.serviceMap[serviceName][route], args);
        return baseURL;
    }
}

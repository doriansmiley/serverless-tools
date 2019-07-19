export interface IConfig {
    baseUrl: string; // base http address of application ie http://localhost:3000
    webRoot: string; // path relative to webroot where the application is deployed
    token: string; // used for oAuth authentication schemes and similar token based authentication systems
    serviceCode: string; // used for assigning a concrete service implementation
    serviceMap: object; // hash to look up routes
    getURLWithParams(serviceName: string, route: string, args?: Array<string>): string;
    getAbsoluteURLWithParams(serviceName: string, route: string, args?: Array<string>): string;
}

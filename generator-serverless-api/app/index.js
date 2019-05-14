'use strict';
// Require dependencies
let Generator = require('yeoman-generator');
let fs = require('fs');
let path = require('path')
const OpenAPISchemaValidator = require('openapi-schema-validator').default;
const SERVICE_NAME_MAX_LENGTH = 20;

class MFourApiGenerator extends Generator {
    // The name `constructor` is important here
    constructor(args, opts) {
        // Calling the super constructor is important so our generator is correctly set up
        super(args, opts);
        // define instance variables
        this.answers = [];
        this.routes = [];
        this.indexVariables = {
            createController: 'CreateController',
            deleteController: 'DeleteController',
            readController: 'ReadController',
            updateController: 'UpdateController',
        };
        this.routesDefs = '';
        this.importStatements = '';
        // hard code v1 in the correct format
        this.apiVersion = 'v1.0.0';
        this.specFile = null;
        this.deployHookCase = [];
    }

    // Your initialization methods (checking current project state, getting configs, etc)
    async initializing() {

    }

    // Where you prompt users for options (where you’d call this.prompt())
    async prompting() {
        return new Promise(async (resolve, reject) => {
            this.answers['apiSpecFile'] = await this.prompt([
                {
                    type: 'input',
                    name: 'apiSpecFile',
                    message: 'Please enter the path to your file. This must be an Open API v3 spec. Start relative paths with ./ or ../.',
                    store: true,
                    validate: (value) => {
                        try {
                            const json = JSON.parse(fs.readFileSync(value, "utf-8").toString());
                            const validator = new OpenAPISchemaValidator({version: 3});
                            const result = validator.validate(json);
                            if (result.errors.length === 0) {
                                if (/^[a-z0-9\-_]+$/i.exec(json.info.title) && json.info.title.length <= SERVICE_NAME_MAX_LENGTH) {
                                    return true;
                                } else {
                                    return 'The provided spec file constains an invalid api name. Please enter a valid api name. Must be <= '+SERVICE_NAME_MAX_LENGTH+' characters, no spaces, lowercase a-z characters and - or _ only.';
                                }
                            } else {
                                return 'The provided spec file is invalid! Please be sure it is an instance of Open API v3';
                            }
                        } catch (e) {
                            return 'Please enter a valid file path';
                        }
                    }
                }
            ]);
            return resolve(this.answers);
        });
    }

    // Saving configurations and configure the project (creating .editorconfig files and other metadata files)
    configuring() {
        console.log(this.answers.apiSpecFile.apiSpecFile);
        this.specFile = this.answers.apiSpecFile.apiSpecFile;
        this.answers.apiSpecFile = JSON.parse(fs.readFileSync(this.answers.apiSpecFile.apiSpecFile).toString());
        // set API info properties
        this.answers.apiName = this.answers.apiSpecFile.info.title;
        this.answers.apiDescription = this.answers.apiSpecFile.info.description;
        this.apiVersion = this.answers.apiSpecFile.info.version;
        // extract routes
        const routeKeys = Object.keys(this.answers.apiSpecFile.paths);
        for (let route of routeKeys) {
            console.log('---Extracted Route: ' + route);
            let httpVerbs = Object.keys(this.answers.apiSpecFile.paths[route]);
            for (let verb of httpVerbs) {
                console.log('------Extracted request verb: ' + verb);
                this.routes.push({
                    route: route,
                    verb: verb,
                    operationId: this.answers.apiSpecFile.paths[route][verb].operationId
                });
            }
        }
    }

    // Where you write the generator specific files (routes, controllers, etc)
    writing() {
        console.log(this.specFile);
        if (!path.isAbsolute(this.specFile)) {
            this.specFile = path.join(path.resolve(), this.specFile);
        }
        console.log(this.specFile);
        this.fs.copy(
            this.templatePath(this.specFile),
            this.destinationPath('apiSpec.json')
        );
        this.fs.copy(
            this.templatePath('.circleci'),
            this.destinationPath('.circleci')
        );
        this.fs.copy(
            this.templatePath('automation'),
            this.destinationPath('automation')
        );
        // copy the abstract base controller
        this.fs.copyTpl(
            this.templatePath('src/controllers/Controller.ts'),
            this.destinationPath('src/controllers/Controller.ts'),
            {
                apiName: this.answers.apiName
            }
        );
        // copy test suites
        this.fs.copy(
            this.templatePath('test/integration/IntegrationUtils.js'),
            this.destinationPath('test/integration/IntegrationUtils.js')
        );
        this.fs.copy(
            this.templatePath('test/integration/test.sh'),
            this.destinationPath('test/integration/test.sh')
        );

        this.fs.copy(
            this.templatePath('test/unit'),
            this.destinationPath('test/unit')
        );

        // for each route / controller create a new controller
        for (let route of this.routes) {
            let className = null;
            let integrationTestFilename = null;
            // create switch case statements for deploy hooks
            this.deployHookCase.push('case serviceName + \'-\' + stageName + \'-' + route.operationId + '\': return pre' + route.operationId + '(event, context, callback);');
            // remove route params from test routes since the unit tests supply these values
            let testRoute = route.route.replace(/\/{.*}/g, '');
            // replace route params with express syntax
            let expressRoute = route.route.replace(/{/g, ':');
            expressRoute = expressRoute.replace(/}/g, '');
            // {route:route, verb: verb, operationId: operationId}
            switch (route.verb.toLowerCase()) {
                case 'post':
                    className = (route.hasOwnProperty('operationId')) ? route.operationId : 'CreateController';
                    integrationTestFilename = (route.hasOwnProperty('operationId')) ? route.operationId + 'RouteTest.js' : 'CreateRouteTest.js';
                    this.fs.copyTpl(
                        this.templatePath('src/controllers/CreateController.ts'),
                        this.destinationPath('src/controllers/' + className + '.ts'),
                        {
                            className: className,
                            apiName: this.answers.apiName
                        }
                    );
                    this.fs.copyTpl(
                        this.templatePath('test/integration/PostRouteTest.js'),
                        this.destinationPath('test/integration/' + integrationTestFilename),
                        {route: testRoute}
                    );
                    this.routesDefs += 'app.post(\'(\\/v[0-9])?' + expressRoute + '\', cors(corsOptions), new ' + className + '().register());\n\n';
                    this.importStatements += 'import {' + className + '} from \'./controllers/' + className + '\';\n';
                    break;
                case 'put':
                    className = (route.hasOwnProperty('operationId')) ? route.operationId : 'UpdateController';
                    integrationTestFilename = (route.hasOwnProperty('operationId')) ? route.operationId + 'RouteTest.js' : 'UpdateRouteTest.js';
                    this.fs.copyTpl(
                        this.templatePath('src/controllers/UpdateController.ts'),
                        this.destinationPath('src/controllers/' + className + '.ts'),
                        {
                            className: className,
                            apiName: this.answers.apiName
                        }
                    );
                    this.fs.copyTpl(
                        this.templatePath('test/integration/PutRouteTest.js'),
                        this.destinationPath('test/integration/' + integrationTestFilename),
                        {route: testRoute}
                    );
                    this.routesDefs += 'app.put(\'(\\/v[0-9])?' + expressRoute + '\', cors(corsOptions), new ' + className + '().register());\n\n';
                    this.importStatements += 'import {' + className + '} from \'./controllers/' + className + '\';\n';
                    break;
                case 'delete':
                    className = (route.hasOwnProperty('operationId')) ? route.operationId : 'DeleteController';
                    integrationTestFilename = (route.hasOwnProperty('operationId')) ? route.operationId + 'RouteTest.js' : 'DeleteRouteTest.js';
                    // TODO copy with variable name for class
                    this.fs.copyTpl(
                        this.templatePath('src/controllers/DeleteController.ts'),
                        this.destinationPath('src/controllers/' + className + '.ts'),
                        {
                            className: className,
                            apiName: this.answers.apiName
                        }
                    );
                    this.fs.copyTpl(
                        this.templatePath('test/integration/DeleteRouteTest.js'),
                        this.destinationPath('test/integration/' + integrationTestFilename),
                        {route: testRoute}
                    );
                    this.routesDefs += 'app.delete(\'(\\/v[0-9])?' + expressRoute + '\', cors(corsOptions), new ' + className + '().register());\n\n';
                    this.importStatements += 'import {' + className + '} from \'./controllers/' + className + '\';\n';
                    break;
                case 'get':
                    className = (route.hasOwnProperty('operationId')) ? route.operationId : 'ReadController';
                    integrationTestFilename = (route.hasOwnProperty('operationId')) ? route.operationId + 'RouteTest.js' : 'ReadRouteTest.js';
                    // TODO copy with variable name for class
                    this.fs.copyTpl(
                        this.templatePath('src/controllers/ReadController.ts'),
                        this.destinationPath('src/controllers/' + className + '.ts'),
                        {
                            className: className,
                            apiName: this.answers.apiName
                        }
                    );
                    this.fs.copyTpl(
                        this.templatePath('test/integration/GetRouteTest.js'),
                        this.destinationPath('test/integration/' + integrationTestFilename),
                        {route: testRoute}
                    );
                    this.routesDefs += 'app.get(\'(\\/v[0-9])?' + expressRoute + '\', cors(corsOptions), new ' + className + '().register());\n\n';
                    this.importStatements += 'import {' + className + '} from \'./controllers/' + className + '\';\n';
                    break;
            }
        }
        console.log(this.routesDefs);
        this.fs.copy(
            this.templatePath('test/assetStorage'),
            this.destinationPath('test/assetStorage')
        );
        this.fs.copy(
            this.templatePath('.npmignore'),
            this.destinationPath('.npmignore')
        );
        this.fs.copy(
            this.templatePath('.gitignore'),
            this.destinationPath('.gitignore')
        );
        this.fs.copy(
            this.templatePath('Globals.js'),
            this.destinationPath('Globals.js')
        );
        this.fs.copy(
            this.templatePath('Gruntfile.js'),
            this.destinationPath('Gruntfile.js')
        );
        this.fs.copyTpl(
            this.templatePath('src/index.ts'),
            this.destinationPath('src/index.ts'),
            {
                routesDefs: this.routesDefs,
                apiName: this.answers.apiName,
                importStatements: this.importStatements
            }
        );
        this.fs.copyTpl(
            this.templatePath('src/deployHooks.ts'),
            this.destinationPath('src/deployHooks.ts'),
            {
                apiVersion: '/v' + parseInt(this.apiVersion, 10),
                routes: this.routes,
                caseStatement: this.deployHookCase.join('\n        ')
            }
        );
        this.fs.copy(
            this.templatePath('package.json'),
            this.destinationPath('package.json')
        );
        this.fs.copy(
            this.templatePath('tslint.json'),
            this.destinationPath('tslint.json')
        );
        this.fs.copyTpl(
            this.templatePath('README.md'),
            this.destinationPath('README.md'),
            {
                apiName: this.answers.apiName,
                apiDescription: this.answers.apiDescription,
                apiVersion: this.apiVersion
            }
        );
        this.fs.copyTpl(
            this.templatePath('serverless.yml'),
            this.destinationPath('serverless.yml'),
            {
                apiName: this.answers.apiName,
                routes: this.routes,
                apiVersion: '/v' + parseInt(this.apiVersion, 10)
            }
        );
        this.fs.copy(
            this.templatePath('tsconfig.json'),
            this.destinationPath('tsconfig.json')
        );
        this.fs.copy(
            this.templatePath('webpack.config.js'),
            this.destinationPath('webpack.config.js')
        );
    }

    // Where installations are run (npm, bower)
    async install() {
        await this.npmInstall();
    }

    // Called last, cleanup, say good bye, etc
    async end() {
        console.log('All components installed, good bye.');
    }
}

module.exports = MFourApiGenerator;

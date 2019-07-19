'use strict';
import * as AWS from 'aws-sdk';
import {PutLifecycleEventHookExecutionStatusInput} from 'aws-sdk/clients/codedeploy';
import {PutLifecycleEventHookExecutionStatusOutput} from 'aws-sdk/clients/codedeploy';
import {InvocationResponse} from 'aws-sdk/clients/lambda';
import {DeploymentId} from 'aws-sdk/clients/codedeploy';
import {LifecycleEventHookExecutionId} from 'aws-sdk/clients/codedeploy';

export enum TestResultEnum {
    Succeeded = 'Succeeded',
    Failed = 'Failed'
}

export class LambdaPreDeployUtils {

    protected lambda: AWS.Lambda = null;

    protected codedeploy: AWS.CodeDeploy = null;

    public constructor(lambda: AWS.Lambda, codedeploy: AWS.CodeDeploy) {
        this.lambda = lambda;
        this.codedeploy = codedeploy;
    }

    protected async invokeAsync(functionName: string, payload: string = null): Promise<InvocationResponse> {
        console.log('INVOKING: ' + JSON.stringify({functionName: functionName, payload: payload}));
        return this.lambda.invoke({
            FunctionName: functionName,
            InvocationType: 'RequestResponse',
            LogType: 'None',
            // always use latest as that is the currently active deployment version
            Qualifier: '$LATEST',
            Payload: payload
        }).promise();
    }

    protected async updateCodeDeployAsync(
        params: PutLifecycleEventHookExecutionStatusInput): Promise<PutLifecycleEventHookExecutionStatusOutput> {
        return this.codedeploy.putLifecycleEventHookExecutionStatus(params).promise();
    }

    public async invoke(functionName: string, payload: any = {}, expectedStatusCode: number = 200, expectedBody: string = ''): Promise<TestResultEnum> {
        try {
            const response = await this.invokeAsync(functionName, JSON.stringify(payload));
            console.log('[INFO] ' + functionName + ' ' + response.StatusCode + ' ' + response.Payload.toString());
            if (response.StatusCode === 200 && response.Payload !== null) {
                const decoded: any =  JSON.parse(response.Payload.toString());
                console.log('[INFO] ' + functionName + ' Response Body: ', decoded.body);
                if (decoded.statusCode === expectedStatusCode && decoded.body === expectedBody) {
                    return TestResultEnum.Succeeded;
                }
            }
        } catch (e) {
            console.log('[ERROR] ' + functionName + ' test failed!' + e.message);
        }

        return TestResultEnum.Failed;
    }

    public async updateCodeDeploy(deploymentId: DeploymentId, executionId: LifecycleEventHookExecutionId, status: TestResultEnum): Promise<void> {

        const params: PutLifecycleEventHookExecutionStatusInput = {
            deploymentId: deploymentId,
            lifecycleEventHookExecutionId: executionId,
            status: status
        };

        try {
            console.log('[INFO] Updating code deploy: ' + JSON.stringify(params));
            await this.updateCodeDeployAsync(params);
        } catch (err) {
            try {
                console.log('[WARN] Retrying code deploy update: ' + JSON.stringify(params) + ' Error: ' + err.message);
                await this.updateCodeDeployAsync(params);
            } catch (e) {
                console.log('[ERROR] Code deploy update failed: ' + e.message);
                throw e;
            }
        }
    }

    public destroy(): void {
        this.lambda = null;
        this.codedeploy = null;
    }
}

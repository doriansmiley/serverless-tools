export class PromiseResolver {

    public resolvePromise(result: any,
                          resolve: (value?: any) => void,
                          reject: (value?: any) => void,
                          error: any = null,
                          callback: (v1, v2) => void = null) {

        if (callback !== null) {
            callback(result, error);
        } else if (error === null) {
            // the value of result can be null, it is not always defined in the case of async functions
            // therefore if the error is null always call resolve
            resolve(result);
        } else {
            reject(error);
        }
    }
}
export class SecurityException extends Error {

    public static readonly NOT_AUTHORIZED = 'Unauthorized to access surveyInstance document.';

    public concreteSecurityException: Error = null;

    public constructor(message: string, error: Error = null) {
        super(message);

        this.concreteSecurityException = error;
    }
}

export class StringUtils {

    /**
     * Given a string with placeholders, replace the each placeholder with the equivalent value in given array
     * Replacement is index-based
     * placeholders must be in the following format {<order_in_string>}, ex: {0}, {1}
     *
     * @returns formatted output
     */
    public static format(format: string, values: Array<string>): string {
        if (!format || !values) {
            return format;
        }
        const re = /\{\d+\}/;
        let output: string = format;
        for (let value of values) {
            output = output.replace(re, value);
        }

        if (output.match(/(\{|\})/)) {
            throw new Error('format output malformed, either values are missing or input format string was not properly formatted');
        }
        return output;
    }

    /**
     * A given a string, escape its characters for use in regex patterns
     * @returns escaped string
     */
    public static escapeRegexChars(input: string): string {
        const regex = /([\[\]\\^$.|?*+()])/g;
        return input.replace(regex, '\\$&');
    }

    /**
     * Given a string with placeholders, replace the each placeholder with the equivalent value in given array
     * Replacement is not index-based, the index of the item in the array is matched against the corresponding token at that index.
     * For example index 0 will match {0} in the string explicitly, even if the token {0} is the third token in the string
     * placeholders must be in the following format {<order_in_string>}, ex: {1}, {0}, {2}
     *
     * @returns formatted output
     */
    public static substitute(str: string, args: Array<string>): string {
        if (!str || !args) {
            return str;
        }

        for (let i = 0; i < args.length; i++) {
            str = str.replace(new RegExp('\\{' + i + '\\}', 'g'), args[i]);
        }

        if (str.match(/(\{|\})/)) {
            throw new Error('format output malformed, either values are missing or input format string was not properly formatted');
        }

        return str;
    }

    /*
     * Please see https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder/encode
     * for browser support. Support looks good for our matrix.
     * a polyfill alternative can be found in the following places:
     * https://github.com/google/closure-library/blob/8598d87242af59aac233270742c8984e2b2bdbe0/closure/goog/crypt/crypt.js#L117-L143
     * or
     * https://www.npmjs.com/package/text-encoding-utf-8
     * npm install text-encoding
     *
     * */
    public static toUTF8Array(str): Uint8Array {
        if (Buffer) {
            return new Buffer(str);
        }
        return new TextEncoder().encode(str);
    }

    /*
     * Please see https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder/TextDecoder
     * for browser support. Support looks good for our matrix.
     * * a polyfill alternative can be found in the following places:
     * https://github.com/google/closure-library/blob/8598d87242af59aac233270742c8984e2b2bdbe0/closure/goog/crypt/crypt.js#L117-L143
     * or
     * https://www.npmjs.com/package/text-encoding-utf-8
     * npm install text-encoding
     * */
    public static fromUTF8Array(uint8array: Uint8Array): string {
        if (Buffer) {
            return (uint8array as Buffer).toString();
        }
        return new TextDecoder('utf-8').decode(uint8array);
    }
}

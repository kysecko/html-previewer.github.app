import { Client } from '../client';
import type { Models } from '../models';
import { ExecutionMethod } from '../enums/execution-method';
export declare class Functions {
    client: Client;
    constructor(client: Client);
    /**
     * Get a list of all the current user function execution logs. You can use the query params to filter your results.
     *
     * @param {string} params.functionId - Function ID.
     * @param {string[]} params.queries - Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: trigger, status, responseStatusCode, duration, requestMethod, requestPath, deploymentId
     * @param {boolean} params.total - When set to false, the total count returned will be 0 and will not be calculated.
     * @throws {AppwriteException}
     * @returns {Promise<Models.ExecutionList>}
     */
    listExecutions(params: {
        functionId: string;
        queries?: string[];
        total?: boolean;
    }): Promise<Models.ExecutionList>;
    /**
     * Get a list of all the current user function execution logs. You can use the query params to filter your results.
     *
     * @param {string} functionId - Function ID.
     * @param {string[]} queries - Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: trigger, status, responseStatusCode, duration, requestMethod, requestPath, deploymentId
     * @param {boolean} total - When set to false, the total count returned will be 0 and will not be calculated.
     * @throws {AppwriteException}
     * @returns {Promise<Models.ExecutionList>}
     * @deprecated Use the object parameter style method for a better developer experience.
     */
    listExecutions(functionId: string, queries?: string[], total?: boolean): Promise<Models.ExecutionList>;
    /**
     * Trigger a function execution. The returned object will return you the current execution status. You can ping the `Get Execution` endpoint to get updates on the current execution status. Once this endpoint is called, your function execution process will start asynchronously.
     *
     * @param {string} params.functionId - Function ID.
     * @param {string} params.body - HTTP body of execution. Default value is empty string.
     * @param {boolean} params.async - Execute code in the background. Default value is false.
     * @param {string} params.xpath - HTTP path of execution. Path can include query params. Default value is /
     * @param {ExecutionMethod} params.method - HTTP method of execution. Default value is POST.
     * @param {object} params.headers - HTTP headers of execution. Defaults to empty.
     * @param {string} params.scheduledAt - Scheduled execution time in [ISO 8601](https://www.iso.org/iso-8601-date-and-time-format.html) format. DateTime value must be in future with precision in minutes.
     * @throws {AppwriteException}
     * @returns {Promise<Models.Execution>}
     */
    createExecution(params: {
        functionId: string;
        body?: string;
        async?: boolean;
        xpath?: string;
        method?: ExecutionMethod;
        headers?: object;
        scheduledAt?: string;
    }): Promise<Models.Execution>;
    /**
     * Trigger a function execution. The returned object will return you the current execution status. You can ping the `Get Execution` endpoint to get updates on the current execution status. Once this endpoint is called, your function execution process will start asynchronously.
     *
     * @param {string} functionId - Function ID.
     * @param {string} body - HTTP body of execution. Default value is empty string.
     * @param {boolean} async - Execute code in the background. Default value is false.
     * @param {string} xpath - HTTP path of execution. Path can include query params. Default value is /
     * @param {ExecutionMethod} method - HTTP method of execution. Default value is POST.
     * @param {object} headers - HTTP headers of execution. Defaults to empty.
     * @param {string} scheduledAt - Scheduled execution time in [ISO 8601](https://www.iso.org/iso-8601-date-and-time-format.html) format. DateTime value must be in future with precision in minutes.
     * @throws {AppwriteException}
     * @returns {Promise<Models.Execution>}
     * @deprecated Use the object parameter style method for a better developer experience.
     */
    createExecution(functionId: string, body?: string, async?: boolean, xpath?: string, method?: ExecutionMethod, headers?: object, scheduledAt?: string): Promise<Models.Execution>;
    /**
     * Get a function execution log by its unique ID.
     *
     * @param {string} params.functionId - Function ID.
     * @param {string} params.executionId - Execution ID.
     * @throws {AppwriteException}
     * @returns {Promise<Models.Execution>}
     */
    getExecution(params: {
        functionId: string;
        executionId: string;
    }): Promise<Models.Execution>;
    /**
     * Get a function execution log by its unique ID.
     *
     * @param {string} functionId - Function ID.
     * @param {string} executionId - Execution ID.
     * @throws {AppwriteException}
     * @returns {Promise<Models.Execution>}
     * @deprecated Use the object parameter style method for a better developer experience.
     */
    getExecution(functionId: string, executionId: string): Promise<Models.Execution>;
}

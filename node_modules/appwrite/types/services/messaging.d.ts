import { Client } from '../client';
import type { Models } from '../models';
export declare class Messaging {
    client: Client;
    constructor(client: Client);
    /**
     * Create a new subscriber.
     *
     * @param {string} params.topicId - Topic ID. The topic ID to subscribe to.
     * @param {string} params.subscriberId - Subscriber ID. Choose a custom Subscriber ID or a new Subscriber ID.
     * @param {string} params.targetId - Target ID. The target ID to link to the specified Topic ID.
     * @throws {AppwriteException}
     * @returns {Promise<Models.Subscriber>}
     */
    createSubscriber(params: {
        topicId: string;
        subscriberId: string;
        targetId: string;
    }): Promise<Models.Subscriber>;
    /**
     * Create a new subscriber.
     *
     * @param {string} topicId - Topic ID. The topic ID to subscribe to.
     * @param {string} subscriberId - Subscriber ID. Choose a custom Subscriber ID or a new Subscriber ID.
     * @param {string} targetId - Target ID. The target ID to link to the specified Topic ID.
     * @throws {AppwriteException}
     * @returns {Promise<Models.Subscriber>}
     * @deprecated Use the object parameter style method for a better developer experience.
     */
    createSubscriber(topicId: string, subscriberId: string, targetId: string): Promise<Models.Subscriber>;
    /**
     * Delete a subscriber by its unique ID.
     *
     * @param {string} params.topicId - Topic ID. The topic ID subscribed to.
     * @param {string} params.subscriberId - Subscriber ID.
     * @throws {AppwriteException}
     * @returns {Promise<{}>}
     */
    deleteSubscriber(params: {
        topicId: string;
        subscriberId: string;
    }): Promise<{}>;
    /**
     * Delete a subscriber by its unique ID.
     *
     * @param {string} topicId - Topic ID. The topic ID subscribed to.
     * @param {string} subscriberId - Subscriber ID.
     * @throws {AppwriteException}
     * @returns {Promise<{}>}
     * @deprecated Use the object parameter style method for a better developer experience.
     */
    deleteSubscriber(topicId: string, subscriberId: string): Promise<{}>;
}

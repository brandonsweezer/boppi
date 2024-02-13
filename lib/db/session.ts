import { NewSessionRequest, Session } from "@/types/session";
import { Repository } from "./container";
import { MongoClient, ObjectId } from "mongodb";

const APP_DB_NAME = 'lookie';
const SESSION_COLLECTION_NAME = 'sessions';

export interface SessionRepository extends Repository<Session, string, NewSessionRequest> {

}

export class MongoDBSessionRepository implements SessionRepository {
    private client: MongoClient;

    constructor({ mongoClient }: { mongoClient: MongoClient }) {
        this.client = mongoClient;
    }

    async readById(id: string): Promise<Session> {
        try {
            const objectId = new ObjectId(id);
            await this.client.connect();
            const session = await this.client.db(APP_DB_NAME).collection(SESSION_COLLECTION_NAME).findOne(
                {
                    _id: objectId,
                }
            )
            if (session === null) {
                console.log('session?', session);
                throw new Error('object not found');
            }
            return session as unknown as Session;
        } catch (e) {
            throw new Error(`failed when accessing session db ${e}`)
        } finally {
            try {
                await this.client.close();
            } catch (e) {
                throw new Error('failed to close mongo client');
            }
        }
    }

    async create(newObjectRequest: NewSessionRequest): Promise<Session> {
        try {
            await this.client.connect();
            const { acknowledged, insertedId } = await this.client.db(APP_DB_NAME).collection(SESSION_COLLECTION_NAME)
                .insertOne(newObjectRequest); 
            if (!acknowledged) {
                console.log('write request not acknowledged!', insertedId);
            }
            const message = await this.readById(insertedId.toString());
            return message;
        } catch (e) {
            throw new Error(`failed when accessing session db ${e}`)
        } finally {
            try {
                await this.client.close();
            } catch (e) {
                throw new Error('failed to close mongo client');
            }
        }
    }
}
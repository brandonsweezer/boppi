import { Message, NewMessageRequest, MessageType } from "@/types/message";
import { Repository } from "./container";
import { MongoClient, ObjectId } from "mongodb";

const APP_DB_NAME = 'lookie';
const MESSAGE_COLLECTION_NAME = 'messages';

export interface MessageRepository extends Repository<Message, string, NewMessageRequest> {
    readByType({ messageType }: { messageType: MessageType }): Promise<Message[]>
}

export class MongoDBMessageRepository implements MessageRepository {
    private client: MongoClient;

    constructor({mongoClient}: {mongoClient: MongoClient}) {
        this.client = mongoClient;
    }

    async readByType({ messageType, toId }: { messageType: MessageType; toId?: string }): Promise<Message[]> {
        try {
            await this.client.connect();
            const messages = await this.client.db(APP_DB_NAME).collection(MESSAGE_COLLECTION_NAME).find(
                {
                    type: messageType,
                    toId
                }
            ).toArray();
            if (messages === null) {
                throw new Error('object not found');
            }
            return messages as unknown as Message[];
        } catch (e) {
            throw new Error(`failed when accessing user db ${e}`)
        } finally {
            try {
                await this.client.close();
            } catch (e) {
                throw new Error('failed to close mongo client');
            }
        }
    }

    async readById(id: string): Promise<Message> {
        try {
            const objectId = new ObjectId(id);
            await this.client.connect();
            const message = await this.client.db(APP_DB_NAME).collection(MESSAGE_COLLECTION_NAME).findOne(
                {
                    _id: objectId,
                }
            )
            if (message === null) {
                throw new Error('object not found');
            }
            return message as unknown as Message;
        } catch (e) {
            throw new Error(`failed when accessing user db ${e}`)
        } finally {
            try {
                await this.client.close();
            } catch (e) {
                throw new Error('failed to close mongo client');
            }
        }
    }

    async create(newObjectRequest: NewMessageRequest): Promise<Message> {
        try {
            await this.client.connect();
            const { acknowledged, insertedId } = await this.client.db(APP_DB_NAME).collection(MESSAGE_COLLECTION_NAME)
                .insertOne(newObjectRequest); 
            if (!acknowledged) {
                console.log('write request not acknowledged!', insertedId);
            }
            const message = await this.readById(insertedId.toString());
            return message;
        } catch (e) {
            throw new Error(`failed when accessing message db ${e}`)
        } finally {
            try {
                await this.client.close();
            } catch (e) {
                throw new Error('failed to close mongo client');
            }
        }
    }

    async delete(id: string): Promise<boolean> {
        try {
            const objectId = new ObjectId(id);
            await this.client.connect();
            
            const { acknowledged, deletedCount } = await this.client.db(APP_DB_NAME).collection(MESSAGE_COLLECTION_NAME).deleteOne({
                _id: objectId
            })
                
            if (!acknowledged) {
                console.log('Delete request not acknowledged!', objectId);
            }
            
            return !!deletedCount;
        } catch (e) {
            throw new Error(`failed when accessing message db ${e}`)
        } finally {
            try {
                await this.client.close();
            } catch (e) {
                throw new Error('failed to close mongo client');
            }
        }
    }
}
import { NewUserRequest, User } from "@/types/user";
import { Repository } from "@/lib/db/container"
import { MongoClient, ObjectId } from "mongodb";

const APP_DB_NAME = 'lookie';
const USER_COLLECTION_NAME = 'users';


export interface UserRepository extends Repository<User, string, NewUserRequest> {
    exists({ email }: { email: string }): Promise<boolean>;
    login({ email, hashedPassword }: { email: string, hashedPassword: string}): Promise<User | null>
}

export class MongoDBUserRepository implements UserRepository {
    client: MongoClient;

    constructor({ mongoClient }: { mongoClient: MongoClient }) {
        this.client = mongoClient;
    }

    async exists({ email }: { email: string; }): Promise<boolean> {
        try {
            await this.client.connect();
            const user = await this.client.db(APP_DB_NAME).collection(USER_COLLECTION_NAME).findOne(
                {
                    email,
                }
            )
            return !!user;
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

    async readById(id: string): Promise<User> {
        try {
            const objectId = new ObjectId(id);
            await this.client.connect();
            const user = await this.client.db(APP_DB_NAME).collection(USER_COLLECTION_NAME).findOne(
                {
                    _id: objectId,
                }
            )
            if (user === null) {
                throw new Error('object not found');
            }
            return user as unknown as User;
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

    async login({ email, hashedPassword }: { email: string; hashedPassword: string; }): Promise<User | null> {
        try {
            await this.client.connect();
            const user = await this.client.db(APP_DB_NAME).collection(USER_COLLECTION_NAME).findOne(
                {
                    email: email,
                    password: hashedPassword
                }
            )
            return user as unknown as User;
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

    async create(newUserRequest: NewUserRequest): Promise<User> {
        try {
            await this.client.connect();
            const { acknowledged, insertedId } = await this.client.db('lookie').collection('users').insertOne(newUserRequest)
            if (!acknowledged) {
                console.log('write request not acknowledged!', insertedId);
            }
            const user = await this.readById(insertedId.toString());
            return user;
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
}
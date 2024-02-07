import { MongoClient, ServerApiVersion } from "mongodb";
import { MongoDBUserRepository } from "./user";
import { MongoDBMessageRepository } from "./message";

const client = new MongoClient(process.env.MONGODB_URI ?? '', {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
})

export interface Repository<T, K, N> {
    readMany?(ids: K[]): Promise<Array<T>>;
    readById?(id: K): Promise<T>;
    create?(newObjectRequest: N): Promise<T>;
    update?(newObject: T): Promise<T>;
    delete?(): Promise<T>;
}

const userRepository = new MongoDBUserRepository({ mongoClient: client });
const messageRepository = new MongoDBMessageRepository({ mongoClient: client });

export { userRepository, messageRepository }
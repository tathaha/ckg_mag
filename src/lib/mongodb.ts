import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

const uri = process.env.MONGODB_URI;
const options: { [key: string]: any } = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

interface CachedConnection {
  client: MongoClient;
  db: Db;
}

let cached: CachedConnection | null = null;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function connectToDatabase(): Promise<CachedConnection> {
  if (cached) {
    return cached;
  }

  if (!clientPromise) {
    throw new Error('MongoDB client promise is not initialized');
  }

  client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB); // Assumes your database name is in the MONGODB_URI

  cached = { client, db };
  return cached;
}

export { clientPromise };
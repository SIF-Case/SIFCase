import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not set");
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoosePromise: Promise<typeof mongoose> | undefined;
}

let cached = global._mongoosePromise;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached) return cached;

  cached = global._mongoosePromise = mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
  });

  return cached;
}

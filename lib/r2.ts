import "server-only";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// Cloudflare R2 (S3 API), private bucket: every read goes through our own routes.
// Env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, optional R2_ENDPOINT.
let client: S3Client | undefined;
function r2() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_ENDPOINT } = process.env;
  const endpoint = R2_ENDPOINT || (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : "");
  if (!endpoint || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) throw new Error("R2 is not configured (see .env.example).");
  client ??= new S3Client({ region: "auto", endpoint, credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY } });
  return { client, Bucket: R2_BUCKET };
}

export const photoKey = (guestId: string) => `guests/${guestId}.jpg`;

export async function putObject(Key: string, Body: Uint8Array, ContentType: string) {
  const { client, Bucket } = r2();
  await client.send(new PutObjectCommand({ Bucket, Key, Body, ContentType }));
}

/** Bytes, or null when the key does not exist. */
export async function getObject(Key: string): Promise<Uint8Array | null> {
  const { client, Bucket } = r2();
  try {
    const out = await client.send(new GetObjectCommand({ Bucket, Key }));
    return out.Body ? await out.Body.transformToByteArray() : null;
  } catch (e) {
    const err = e as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) return null;
    throw e;
  }
}

export async function deleteObject(Key: string) {
  const { client, Bucket } = r2();
  await client.send(new DeleteObjectCommand({ Bucket, Key }));
}

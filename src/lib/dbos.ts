import { DBOSClient } from "@dbos-inc/dbos-sdk";
import { getDatabaseUrl } from "./databases";

const clientCache = new Map<string, Promise<DBOSClient>>();

export function getDBOSClient(databaseKey: string): Promise<DBOSClient> {
  const url = getDatabaseUrl(databaseKey);
  if (!url) {
    return Promise.reject(
      new Error(
        `No database URL for "${databaseKey}". Add DBOS_DATABASE_${databaseKey}=postgresql://... to .env.local.`
      )
    );
  }
  let promise = clientCache.get(databaseKey);
  if (!promise) {
    promise = DBOSClient.create({ systemDatabaseUrl: url });
    clientCache.set(databaseKey, promise);
  }
  return promise;
}

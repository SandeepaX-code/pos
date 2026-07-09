import type { Firestore } from "firebase-admin/firestore";

export type FirestoreCrudFilter = Record<string, unknown>;

export type FirestoreCrudRepository<
  TDoc extends { id?: string },
  TCreate extends object = Partial<TDoc>,
  TUpdate extends object = Partial<TDoc>,
> = {
  list(filter?: FirestoreCrudFilter): Promise<TDoc[]>;
  findById(id: string): Promise<TDoc | null>;
  create(payload: TCreate): Promise<TDoc>;
  updateById(id: string, payload: TUpdate): Promise<TDoc | null>;
  deleteById(id: string): Promise<TDoc | null>;
  count(filter?: FirestoreCrudFilter): Promise<number>;
};

// Utility to keep the repository typing permissive during migration.
// This avoids cascading TS errors when route payload shapes differ from TDoc.
// We still validate with zod at the route layer.
export type AnyPayload = Record<string, unknown>;

type Options = {
  collectionPath: string;
};

export function createFirestoreCrudRepository<
  TDoc extends { id?: string },
  TCreate extends object = Partial<TDoc>,
  TUpdate extends object = Partial<TDoc>,
>(
  db: Firestore,
  options: Options,
): FirestoreCrudRepository<TDoc, TCreate, TUpdate> {
  const { collectionPath } = options;

  async function toList(filter?: FirestoreCrudFilter): Promise<TDoc[]> {
    // Minimal implementation for now: only supports full collection listing.
    // Complex filtering must be implemented per-repository.
    if (filter && Object.keys(filter).length > 0) {
      throw new Error(
        `FirestoreCrudRepository.list currently only supports empty filter. Got keys: ${Object.keys(
          filter,
        ).join(", ")}`,
      );
    }

    const snap = await db.collection(collectionPath).get();
    return snap.docs.map(
      (d) =>
        ({
          id: d.id,
          ...(d.data() as Record<string, unknown>),
        }) as TDoc,
    );
  }

  return {
    list: (filter) => toList(filter),

    async findById(id) {
      const ref = db.collection(collectionPath).doc(id);
      const snap = await ref.get();
      if (!snap.exists) return null;
      return {
        id: snap.id,
        ...(snap.data() as Record<string, unknown>),
      } as TDoc;
    },

    async create(payload) {
      const ref = db.collection(collectionPath).doc();
      const data = payload as unknown as Record<string, unknown>;
      await ref.set(data, { merge: false });
      return {
        id: ref.id,
        ...(data as Record<string, unknown>),
      } as TDoc;
    },

    async updateById(id, payload) {
      const ref = db.collection(collectionPath).doc(id);
      const snap = await ref.get();
      if (!snap.exists) return null;

      const data = payload as unknown as Record<string, unknown>;
      await ref.set(data, { merge: true });
      const after = await ref.get();

      return {
        id: after.id,
        ...(after.data() as Record<string, unknown>),
      } as TDoc;
    },

    async deleteById(id) {
      const ref = db.collection(collectionPath).doc(id);
      const snap = await ref.get();
      if (!snap.exists) return null;

      await ref.delete();
      return {
        id: snap.id,
        ...(snap.data() as Record<string, unknown>),
      } as TDoc;
    },

    async count(filter) {
      if (filter && Object.keys(filter).length > 0) {
        throw new Error(
          `FirestoreCrudRepository.count currently only supports empty filter. Got keys: ${Object.keys(
            filter,
          ).join(", ")}`,
        );
      }

      const snap = await db.collection(collectionPath).get();
      return snap.size;
    },
  };
}

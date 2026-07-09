import type {
  CrudFilter,
  CrudRepository,
} from "@/lib/repositories/crud-repository";

export type CrudService<
  TDocument,
  TCreate extends object = Partial<TDocument>,
  TUpdate extends object = Partial<TDocument>,
> = {
  list(filter?: CrudFilter): Promise<TDocument[]>;
  get(id: string): Promise<TDocument>;
  create(payload: TCreate): Promise<TDocument>;
  update(id: string, payload: TUpdate): Promise<TDocument>;
  remove(id: string): Promise<TDocument>;
  count(filter?: CrudFilter): Promise<number>;
};

export function createCrudService<
  TDocument,
  TCreate extends object = Partial<TDocument>,
  TUpdate extends object = Partial<TDocument>,
>(
  repository: CrudRepository<TDocument, TCreate, TUpdate>,
): CrudService<TDocument, TCreate, TUpdate> {
  async function requireRecord(record: TDocument | null, message: string) {
    if (!record) {
      throw new Error(message);
    }

    return record;
  }

  return {
    list(filter) {
      return repository.list(filter);
    },
    async get(id) {
      return requireRecord(await repository.findById(id), "Record not found");
    },
    create(payload) {
      return repository.create(payload);
    },
    async update(id, payload) {
      return requireRecord(
        await repository.updateById(id, payload),
        "Record not found",
      );
    },
    async remove(id) {
      return requireRecord(await repository.deleteById(id), "Record not found");
    },
    count(filter) {
      return repository.count(filter);
    },
  };
}

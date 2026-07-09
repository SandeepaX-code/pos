import type { Model, UpdateQuery } from "mongoose";
export type CrudFilter = Record<string, unknown>;

export type CrudRepository<
  TDocument,
  TCreate extends object = Partial<TDocument>,
  TUpdate extends object = Partial<TDocument>,
> = {
  list(filter?: CrudFilter): Promise<TDocument[]>;
  findById(id: string): Promise<TDocument | null>;
  create(payload: TCreate): Promise<TDocument>;
  updateById(id: string, payload: TUpdate): Promise<TDocument | null>;
  deleteById(id: string): Promise<TDocument | null>;
  count(filter?: CrudFilter): Promise<number>;
};

export function createCrudRepository<
  TDocument,
  TCreate extends object = Partial<TDocument>,
  TUpdate extends object = Partial<TDocument>,
>(model: Model<TDocument>): CrudRepository<TDocument, TCreate, TUpdate> {
  return {
    list(filter = {}) {
      return model.find(filter as never).exec();
    },
    findById(id) {
      return model.findById(id).exec();
    },
    create(payload) {
      return model.create(payload);
    },
    updateById(id, payload) {
      return model
        .findByIdAndUpdate(id, payload as UpdateQuery<TDocument>, {
          new: true,
          runValidators: true,
        })
        .exec();
    },
    deleteById(id) {
      return model.findByIdAndDelete(id).exec();
    },
    count(filter = {}) {
      return model.countDocuments(filter as never).exec();
    },
  };
}

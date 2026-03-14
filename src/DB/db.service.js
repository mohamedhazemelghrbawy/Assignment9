export const create = async ({ model, data } = {}) => {
  return await model.create(data);
};
export const findOne = async ({ model, filter = {}, options = {} } = {}) => {
  let doc = model.findOne(filter);
  if (options.populate) {
    doc.populate(options.populate);
  }
  if (options.skip) {
    doc.skip(options.skip);
  }
  if (options.limit) {
    doc.limit(options.limit);
  }
  if (options.select) {
    doc.select(options.select);
  }
  return await doc.exec();
};

export const find = async ({ model, filter = {}, options = {} } = {}) => {
  let doc = model.find(filter);
  if (options.populate) {
    doc.populate(options.populate);
  }
  if (options.skip) {
    doc.skip(options.skip);
  }
  if (options.limit) {
    doc.limit(options.limit);
  }
  return await doc.exec();
};
export const updateOne = async ({
  model,
  filter = {},
  update = {},
  options = {},
} = {}) => {
  const doc = model.updateOne(filter, update, {
    runValidators: true,
    ...options,
  });

  return await doc.exec();
};
export const findOndeAndUpdate = async ({
  model,
  filter = {},
  update = {},
} = {}) => {
  const doc = model.findOndeAndUpdate(filter, update, {
    new: true,
    runValidators: true,
    ...options,
  });

  return await doc.exec();
};

export const deleteOne = async ({ model, filter = {} } = {}) => {
  return await model.deleteOne(filter);
};

export const deleteMany = async ({ model, filter = {} } = {}) => {
  return await model.deleteMany(filter);
};

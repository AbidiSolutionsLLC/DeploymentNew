class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id, options = {}) {
    let query = this.model.findById(id);
    if (options.populate) query = query.populate(options.populate);
    if (options.select) query = query.select(options.select);
    return query.exec();
  }

  async findOne(filter, options = {}) {
    let query = this.model.findOne(filter);
    if (options.populate) query = query.populate(options.populate);
    if (options.select) query = query.select(options.select);
    return query.exec();
  }

  async find(filter = {}, options = {}) {
    let query = this.model.find(filter);
    if (options.populate) query = query.populate(options.populate);
    if (options.select) query = query.select(options.select);
    if (options.sort) query = query.sort(options.sort);
    if (options.limit) query = query.limit(options.limit);
    if (options.skip) query = query.skip(options.skip);
    return query.exec();
  }

  async create(data) {
    return this.model.create(data);
  }

  async updateById(id, data, options = { new: true }) {
    return this.model.findByIdAndUpdate(id, data, options).exec();
  }

  async deleteById(id) {
    return this.model.findByIdAndDelete(id).exec();
  }

  async countDocuments(filter = {}) {
    return this.model.countDocuments(filter).exec();
  }
}

module.exports = BaseRepository;

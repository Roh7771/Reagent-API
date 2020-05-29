class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };

    const excludedFields = [`page`, `sort`, `limit`, `fileds`];
    excludedFields.forEach(el => delete queryObj[el]);

    if (queryObj.name) {
      queryObj.name = {
        $regex: queryObj.name,
        $options: "i"
      };
    }

    if (queryObj.casNumber) {
      queryObj.casNumber = {
        $regex: queryObj.casNumber,
        $options: "i"
      }
    }

    if (queryObj.location) {
      queryObj.location = {
        $in: queryObj.location.split(',')
      };
    }

    this.query.find(queryObj);

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      this.query = this.query.sort(`${this.queryString.sort} number`);
    } else {
      this.query = this.query.sort(`location number`);
    }

    return this;
  }
}

module.exports = APIFeatures;
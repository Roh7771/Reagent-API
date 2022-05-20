const Substance = require("./../models/substanceModel");

exports.createSubstance = async (req, res) => {
  try {
    const newSubstance = await Substance.create(req.body);

    res.status(201).json({
      status: `success`,
      substance: newSubstance
    });
  } catch (err) {
    res.status(400).json({
      status: `failed`,
      message: err
    });
  }
};

exports.getAllSubstances = async (req, res) => {
  try {
    const queryObj = { ...req.query };

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
    
    if (queryObj.place) {
      queryObj.place = {
        $in: queryObj.place.split(','),
      };
    }

    let query = Substance.find(queryObj);

    if (req.query.sort) {
      query = query.sort(`${req.query.sort} number`);
    } else {
      query = query.sort(`location number`);
    }

    const substances = await query;

    res.status(200).json({
      status: `success`,
      substances
    });
  } catch (err) {
    res.status(404).json({
      status: `failed`,
      message: err
    });
  }
};

exports.getSubstance = async (req, res) => {
  try {
    const substance = await Substance.findById(req.params.id);

    res.status(200).json({
      status: `success`,
      substance
    });
  } catch (err) {
    res.status(404).json({
      status: `failed`,
      message: err
    });
  }
};

exports.updateSubstance = async (req, res) => {
  try {
    const substance = await Substance.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      status: `success`,
      substance
    });
  } catch (err) {
    res.status(404).json({
      status: `failed`,
      message: err
    });
  }
};

exports.deleteSubstance = async (req, res) => {
  try {
    await Substance.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: `success`,
      data: null
    });
  } catch (err) {
    res.status(404).json({
      status: `failed`,
      message: err
    });
  }
};

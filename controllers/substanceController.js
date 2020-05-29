const Substance = require("./../models/substanceModel");
const factory = require("./handlerFactory");

exports.createSubstance = factory.createOne(Substance);

exports.getAllSubstances = factory.getAll(Substance);

exports.getSubstance = factory.getOne(Substance);

exports.updateSubstance = factory.updateOne(Substance);

// exports.deleteSubstance = catchAsync(async (req, res, next) => {
//   const substance = await Substance.findByIdAndDelete(req.params.id);

//   if (!substance) {
//     return next(new AppError('No substance found with that ID', 404)); // все ожидаемые ошибки теперь создаются с помощью специального класса и пробрасываются в next
//   }

//   res.status(204).json({
//     status: `success`,
//     data: null,
//   });
// });

exports.deleteSubstance = factory.deleteOne(Substance);

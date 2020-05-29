const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");
const multer = require("multer");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/users')
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  }
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not a image!', 400), false);
  }
}

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo')

// Функция фильтрует req.body, когда пользователь хочет изменить свои данные. Необходимо, чтобы от не смог установить себе, например, поле role: admin
// В req.body останутся только те поля, которые переданы в аргументы в функции, начиная со второго (все они будут записаны в переменную allowedFileds внутри функции)
const filterObj = (obj, ...allowedFileds) => {
  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFileds.includes(el)) {
      newObj[el] = obj[el];
    }
  });

  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
}
exports.getUser = factory.getOne(User);

exports.getAllUsers = factory.getAll(User);

// Функция для редактирования данных самим юзером
exports.updateMe = catchAsync(async (req, res, next) => {
  // Запрещается менять пароль через этот рут
  if (req.body.password) {
    return next(
      new AppError(
        "This route in not for password update. Please use /updateMyPassword",
        400
      )
    );
  }
  //

  // Фильтрация изменяемых полей
  const filteredBody = filterObj(req.body, "name");
  if (req.file) {
    filteredBody.photo = req.file.filename;
  }
  //

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

// Функция позволяет "удалить" себя из базы данных путем изменения флага active
// В будущем, при попытке получить список пользователей админом эти пользователи не появятся в списке
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

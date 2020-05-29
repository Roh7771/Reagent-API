const User = require("../models/userModel");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");
const crypto = require("crypto");

// Создает JWT-токен, записывая id-пользователя в payload
// После декодирования можно найти юзера по id
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Создает и отправляет токен каждый раз, когда пользователь логинится, регистрируется, меняет или восстанавливает пароль и т.д.
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true
  }

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined; // На всякий случай убираем поле password

  res.status(statusCode).json({
    status: "success",
    token, // Так лучше не передавать токен
    data: {
      user,
    },
  });
};

// exports.checkSession = async (req, res) => {
//   try {
//     if (req.session.user) {
//       res.status(200).json({
//         status: `success`,
//         csrfToken: res.locals.csrfToken
//       });
//     } else {
//       res.status(401).json({
//         status: `failed`,
//         csrfToken: res.locals.csrfToken
//       });
//     }
//   } catch (err) {
//     res.status(401).json({
//       status: `failed`,
//       message: err,
//     });
//   }
// };

// Функция для логина юзера
exports.login = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ name: req.body.name }).select("+password"); // добавляем поле password, которое не возвращается по умолчанию

  if (
    !user ||
    !(await user.correctPassword(req.body.password, user.password))
  ) {
    return next(new AppError("Incorrect email or password", 401));
  }

  createSendToken(user, 200, res);

  // if (user) {
  // const areSame = await user.correctPassword(password, user.password);

  // if (areSame) {
  //   req.session.user = user;

  //   req.session.save((err) => {
  //     if (err) throw err;
  //     res.status(200).json({
  //       status: `success`,
  //       user,
  //     });
  //   });
  // } else {
  //   res.status(400).json({    ПЕРЕПИСАТЬ ЧЕРЕЗ new AppError()
  //     status: `failed`,
  //     message: "Неверное имя или пароль",
  //   });
  // }
  // }
});

// Функция регистрации нового пользователя
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    password: req.body.password,
  });

  createSendToken(newUser, 201, res);

  // req.session.user = newUser;
  // req.session.save((err) => {
  //   if (err) throw err;
  //   res.status(201).json({
  //     status: `success`,
  //     user: newUser,
  //   });
  // });
});

// exports.logOutUser = async (req, res) => {
//   req.session.destroy(() => {
//     res.status(200).json({
//       status: `success`,
//     });
//   });
// };

// Функция для защиты определенных или всех рутов. Проверяет токен, который присылается через header или cookie.
// Если пользователь успешно найден, в req.user записывает залогиневшегося юзера, чтобы следующие в цепочке middleware могли этим пользоваться.
// В цепочке middleware для определенного рута стоит на первом месте
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("You are not logged in!", 401));
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError("The user no longer exist", 401));
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again"),
      401
    );
  }

  req.user = currentUser;
  next();
});

// В качестве аргументов принимает роли пользователей, которые могут пользоваться этим рутом
// Проверяет роль пользователя, записанного в req.user предшествующей функцией protect
// Если все ок, передает управление следующей middleware в цепочке
// В цепочке middleware стоит второй после функции protect
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action"),
        403
      );
    }

    next();
  };
};

// Ищет пользователя по имени/email. Создает токен для восстановления пароля с временем действия 10 минут. Хешированный токен и время когда перестанет действовать токен хранится в базе данных
// Отправляет url, по которому можно восстановить пароль (используется Patch-запрос с новым паролем)
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ name: req.body.name });

  if (!user) {
    return next(new AppError("There is no such user", 404));
  }

  // Создается и сохраняется токен для восстановления пароля и время его действия
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //

  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Send Patch request with your new password on ${resetURL}.\nOtherwise ignore this message!`;

  try {
    await sendEmail({
      email: "belov.rom-77@yandex.ru",
      subject: "Your password reset token (valid for 10 min)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to email",
    });
  } catch (error) {
    // Стираем токен и время его действия из базы данных, если не удалось отправить сообщение по email
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    //

    return next(
      new AppError("There was an error sending the email. Try again later", 500)
    );
  }
});

// В руте в качестве параметра не хешированный токен, ищется юзер с этим токен, при этом проверяется, не истек ли время действия токена
// После успешной проверки меняется пароль и поле passwordChangedAt, чтобы больше нельзя было зайти по старым токенам
exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invaid or has expired", 400));
  }
  user.password = req.body.password;
  // Если пользователь успешно найден, удаляем запись о токене и времени его действия
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //

  createSendToken(user, 200, res);
});

// Ищет юзера по id (записано в req.user благодаря функции предшествующей функции protect)
// Проверяет текущий пароль из req.body с паролем в базе. Если все ок, записывает новый пароль
exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  if (
    !user ||
    !(await user.correctPassword(req.body.currentPassword, user.password))
  ) {
    return next(new AppError("Your current password is wrong", 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  createSendToken(user, 200, res);
});

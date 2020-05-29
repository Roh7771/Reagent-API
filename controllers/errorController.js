const AppError = require('../utils/appError');

// Обработчики ошибок, которые необходимо пометить флагом isOperational и красиво отредактировать сообщение для production
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
}

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/([""'])(\\?.)*?\1/)[0];
  const message = `Duplicate fileld value: ${value}. Please use another value`;
  return new AppError(message, 400);
}

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map (el => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400)
}

const handleJWTError = () => {
  return new AppError('Invalid token. Please login again', 401);
}

const handleJWTExpiredError = () => {
  return new AppError('Your token has expired! Please login again', 401);
}
//

// Функции для отправки сообщений об ошибки в зависимости от режима dev/prod
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error("Error!!!", err);

    res.status(500).json({
      status: "error",
      message: "Something went very wrong",
    });
  }
};
//


// Функция для обработки любых ошибок в ходе работы приложения
// В итоге запускает функции sendErrorDev или sendErrorProd
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err, message: err.message };

    // В production mode нужно прописать все случаи ошибок, которые необходимо пометить флагом isOperational и красиво отредактировать сообщение
    if (error.name === "CastError") {
      error = handleCastErrorDB(error);
    }
    if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }
    if (error.name === "ValidationError") {
      error = handleValidationErrorDB(error);
    }
    if (error.name === "JsonWebTokenError") {
      error = handleJWTError();
    }
    if (error.name === "TokenExpiredError") {
      error = handleJWTExpiredError();
    }
    //
    
    sendErrorProd(error, res);
  }
};

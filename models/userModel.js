const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "A user must have a name"],
  },
  password: {
    type: String,
    required: [true, "A user must have a password"],
    select: false,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// При создании или изменении пароля он шифруется для сохранения в базе данных 
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Если при сохранении пользователя пароль не меняется, middleware пропускается

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// При изменении пароля (не создании) изменяется поле passwordChangedAt, чтобы старые токены больше не работали
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Проверяет совпадение паролей
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Проверяет, не сменил ли пользователь пароль после получения токена
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

// Создает и записывает юзеру токен для восстановления пароля и время его действия
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Перед любым метод, начинающийся на find (findOne, findByIdAndUpdate и т.д.) убирает все элементы, у которых поле active=false
userSchema.pre(/^find/, function (next) {
  this.find({ active: {$ne: false} });
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;

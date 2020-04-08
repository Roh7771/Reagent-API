const User = require("./../models/userModel");
const bcrypt = require("bcryptjs");

exports.checkSession = async (req, res) => {
  try {
    if (req.session.user) {
      res.status(200).json({
        status: `success`,
      });
    } else {
      res.status(401).json({
        status: `failed`,
      });
    }
  } catch (err) {
    res.status(401).json({
      status: `failed`,
      message: err,
    });
  }
};

exports.checkUser = async (req, res) => {
  try {
    const user = await User.findOne({ name: req.body.name });

    if (user) {
      const areSame = await bcrypt.compare(req.body.password, user.password);

      if (areSame) {
        req.session.user = user;

        req.session.save((err) => {
          if (err) throw err;
          res.status(200).json({
            status: `success`,
            user,
          });
        });
      } else {
        res.status(400).json({
          status: `failed`,
          message: "Неверное имя или пароль",
        });
      }
    }
  } catch (err) {
    res.status(401).json({
      status: `failed`,
      message: err,
    });
  }
};

exports.createUser = async (req, res) => {
  try {
    const user = await User.findOne({ name: req.body.name });
    if (user) {
      res.status(400).json({
        status: `failed`,
        message: "Пользователь с таким именем уже существует",
      });
      return;
    }

    const hashPassword = await bcrypt.hash(req.body.password, 10);

    const newUser = await User.create({ ...req.body, password: hashPassword });

    req.session.user = newUser;

    req.session.save((err) => {
      if (err) throw err;
      res.status(201).json({
        status: `success`,
        user: newUser,
      });
    });
  } catch (err) {
    res.status(400).json({
      status: `failed`,
      message: err,
    });
  }
};

exports.logOutUser = async (req, res) => {
  req.session.destroy(() => {
    res.status(200).json({
      status: `success`,
    });
  });
};

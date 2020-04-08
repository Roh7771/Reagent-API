const express = require('express');
const userController = require(`./../controllers/userController`)

const router = express.Router();

router
  .route(`/login`)
  .get(userController.checkSession)
  .post(userController.checkUser);

router
  .route(`/signup`)
  .post(userController.createUser);

router
  .route(`/logout`)
  .get(userController.logOutUser);

module.exports = router;
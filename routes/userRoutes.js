const express = require("express");
const authController = require(`../controllers/authController`);
const userController = require("../controllers/userController");
const multer = require("multer");

const router = express.Router();

router.route("/").get(userController.getAllUsers);

router
  .route(`/login`)
  // .get(userController.checkSession)
  .post(authController.login);

router.route(`/signup`).post(authController.signup);

router.route("/forgotPassword").post(authController.forgotPassword);
router.route("/resetPassword/:token").patch(authController.resetPassword);

router
  .route("/updateMyPassword")
  .patch(authController.protect, authController.updatePassword);

router
  .route("/updateMe")
  .patch(authController.protect, userController.uploadUserPhoto, userController.updateMe);

router
  .route("/deleteMe")
  .delete(authController.protect, userController.deleteMe);

router.route("/me").get(authController.protect, userController.getMe);

// router.route(`/logout`).get(authController.logOutUser);

module.exports = router;

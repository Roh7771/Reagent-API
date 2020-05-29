const express = require('express');
const substanceController = require(`./../controllers/substanceController`);
const authController = require('../controllers/authController');

const router = express.Router();

// router.use((req, res, next) => {
//   if (req.session.user) {
//     next()
//   } else {
//     res.status(401).json({
//       status: `failed`,
//     });
//   }
// })

router
  .route(`/`)
  .get(authController.protect, substanceController.getAllSubstances)
  .post(substanceController.createSubstance);

router
  .route(`/:id`)
  .get(substanceController.getSubstance)
  .patch(substanceController.updateSubstance)
  .delete(authController.protect, authController.restrictTo('admin'), substanceController.deleteSubstance);

module.exports = router;
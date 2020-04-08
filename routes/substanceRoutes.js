const express = require('express');
const substanceController = require(`./../controllers/substanceController`)

const router = express.Router();

router.use((req, res, next) => {
  if (req.session.user) {
    next()
  } else {
    res.status(401).json({
      status: `failed`,
    });
  }
})

router
  .route(`/`)
  .get(substanceController.getAllSubstances)
  .post(substanceController.createSubstance);

router
  .route(`/:id`)
  .get(substanceController.getSubstance)
  .patch(substanceController.updateSubstance)
  .delete(substanceController.deleteSubstance);

module.exports = router;
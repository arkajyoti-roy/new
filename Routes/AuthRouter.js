
const { signup, login } = require('../Controllers/AuthController');
const { signupValidation, loginValidation,  } = require('../Middlewares/AuthValidation');
// Routes/AuthRouter.js
// const UserModel = require('../models/User');

const router = require('express').Router();

router.post('/login', loginValidation, login);
router.post('/signup', signupValidation, signup);






module.exports = router;
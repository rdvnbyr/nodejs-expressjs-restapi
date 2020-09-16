const express = require('express');
const { body } = require('express-validator');

const User = require('../models/user');
const authController = require('../controllers/auth');
const statusController = require('../controllers/status');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.put(
    '/signup',
    [
        body('email')
            .isEmail()
            .withMessage('Please enter Email')
            .custom((value, {req}) => {
                return User.findOne({email: value})
                            .then(userDoc => {
                                if (userDoc) {
                                    return Promise.reject('E-mail already exist');
                                };
                            });
            })
            .normalizeEmail(),
        body('password').trim().isLength({min: 5}),
        body('name').trim().not().isEmpty()
    ],
    authController.signup
);

router.post('/login', authController.login);

router.get('/status', isAuth, statusController.getStatus);

router.patch(
    '/status',
    isAuth,
    [
        body('status').trim().not().isEmpty()
    ],
    statusController.updateStatus
);

module.exports = router;
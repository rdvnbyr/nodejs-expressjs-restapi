
const User = require('../models/user');


exports.getStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId)
        if (!user) {
            const error = new Error('No find user');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({status: user.status});
    } catch(err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.updateStatus = async (req, res, next) => {
    const newStatus = req.body.status;
    try {
        const user = await User.findById(req.userId)
        if (!user) {
            const error = new Error('No find user');
            error.statusCode = 404;
            throw error;
        }
        user.status = newStatus;
        await user.save();
        res.status(200).json({messages: 'user updated.', data: user});
    } catch(err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};
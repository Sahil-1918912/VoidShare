const User = require('../models/Users.js');
const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis.js');


const generateToken = require('../utils/jwtHelper.js').generateToken;

const setUserOnline = async (username) => {
    await redisClient.set(`online:${username}`, 'true', 'EX', 2700); // Set user online with 45-min expiration
};

exports.registerUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        const check = await User.findOne({ username });
        if (check) {
            return res.status(400).json({ error: 'User already exists' });
        }

        let user = await User.create({ username, password });
        console.log(user);

        await setUserOnline(username);
        console.log("User added to redis");
        res.status(201).json({ user,token: generateToken(user._id) });

    } catch (error) {
        res.status(500).json({ error: 'Error creating user' });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // if (user.password !== password) {
        //     return res.status(401).json({ error: 'Wrong Password' });
        // }

        if(!await user.matchPassword(password)){
            return res.status(401).json({ error: 'Wrong Password' });
        }

        await setUserOnline(username);
        res.status(200).json({ user,token: generateToken(user._id) });
        // res.status(200).json({ user});
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
};

exports.getUserProfile = async (req, res) => {
    const user = await User.findById(req.user.id);
    await setUserOnline(user.username);
    res.json(user);
};

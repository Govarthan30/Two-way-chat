// authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const router = express.Router();

const JWT_SECRET = 'your-secret-key';

// Register new user
router.post('/register', async (req, res) => {
    const { username, password, email } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, password: hashedPassword, email });
    try {
        await newUser.save();
        res.status(201).send('User registered successfully!');
    } catch (err) {
        res.status(500).send('Error registering user.');
    }
});

// Login user and generate JWT
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
        return res.status(400).send('User not found.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).send('Invalid credentials.');
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    
    // Store token in the database
    user.token = token;
    await user.save();

    res.status(200).send({ token });
});

module.exports = router;

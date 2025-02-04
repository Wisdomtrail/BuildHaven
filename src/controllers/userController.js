const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinaryConfig');

require('dotenv').config();

const UserController = () => {

    const register = async (req, res) => {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const [firstName, lastName] = fullName.split(' ');

        if (!firstName || !lastName) {
            return res.status(400).json({ message: 'Full name must include first and last name' });
        }

        try {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }

            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);

            const newUser = new User({
                firstName,
                lastName,
                email,
                password,
                orders: [],  
                coupons: [
                    {
                        code: '10OFF',
                        discount: 10,
                        expiryDate: expiryDate,
                        isUsed: false,
                    }
                ],  
            });

            const hashedPassword = await bcrypt.hash(password, 10);
            newUser.password = hashedPassword;

            await newUser.save();

            const token = jwt.sign(
                { id: newUser._id, email: newUser.email },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.status(201).json({
                message: 'User registered successfully',
                token: token,
                user: {
                    id: newUser._id,
                    email: newUser.email,
                    name: `${newUser.firstName} ${newUser.lastName}`
                }
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    };

    const login = async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        try {
            const existingUser = await User.findOne({ email });
            if (!existingUser) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            const isPasswordMatch = await bcrypt.compare(password, existingUser.password);
            if (!isPasswordMatch) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { id: existingUser._id, email: existingUser.email }, // Payload
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );


            res.status(200).json({
                message: 'Login successful',
                token: token,
                user: {
                    id: existingUser._id,
                    email: existingUser.email,
                    name: existingUser.name
                }
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }

    }

    const uploadProfileImage = async (req, res) => {
        const { userId } = req.params;
        const file = req.file;

        const cleanedUserId = userId.startsWith(":") ? userId.substring(1) : userId;

        if (!file) {
            return res.status(400).json({ message: 'No profile image uploaded' });
        }

        try {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'auto',
                    folder: 'user_profiles',
                },
                async (error, result) => {
                    if (error) {
                        return res.status(500).json({ message: 'Error uploading image', error });
                    }

                    const user = await User.findById(cleanedUserId);
                    if (!user) {
                        return res.status(404).json({ message: 'User not found' });
                    }

                    user.profileImageUrl = result.secure_url;
                    await user.save();

                    return res.status(200).json({
                        message: 'Profile image uploaded successfully',
                        profileImageUrl: result.secure_url,
                    });
                }
            );

            // Ensure file buffer is being properly piped to Cloudinary upload stream
            if (file && file.buffer) {
                uploadStream.end(file.buffer); // Send file buffer to Cloudinary
            } else {
                return res.status(400).json({ message: 'Invalid file format or file missing' });
            }
        } catch (err) {
            console.error('Error uploading profile image:', err);
            if (!res.headersSent) {
                return res.status(500).json({ message: 'Image upload failed', error: err });
            }
        }
    };

    const updateUserInfo = async (req, res) => {
        const { userId } = req.params;
        const { firstname, lastname, password, email } = req.body; 
        
        const cleanedUserId = userId.startsWith(":") ? userId.substring(1) : userId;

        try {
            const user = await User.findById(cleanedUserId);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            if (firstname) {
                user.firstName = firstname;
            }

            if (lastname) {
                user.lastName = lastname;
            }

            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10); 
                user.password = hashedPassword;
            }

            if (email) {
                user.email = email;
            }

            await user.save();

            return res.status(200).json({
                message: 'User information updated successfully',
                user,
            });
        } catch (err) {
            console.error('Error updating user info:', err);
            return res.status(500).json({ message: 'Error updating user info', error: err });
        }
    };

    const getUserProfile = async (req, res) =>{
        const { userId } = req.params;        
        const cleanedUserId = userId.startsWith(":") ? userId.substring(1) : userId;

        try{
            const user = await User.findById(cleanedUserId);
            
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const fullName = user.firstName + " " + user.lastName;
            const email = user.email;
            const orders = user.orders;
            const profileImage = user.profileImageUrl;

            return res.status(200).json({
                fullName: fullName,
                email: email,
                profileImage: profileImage,
                orders: orders
            })

        }
        catch(err){
            console.error('Eroor getting User Profile:', err);
            return res.status(500).json({
                message: 'Eroor getting User Profile',
                error: err
            })
        }
    }
    const deleteUser = async (req, res) => {
        const { userId } = req.params;
        const cleanedUserId = userId.startsWith(":") ? userId.substring(1) : userId;
    
        try {
            const user = await User.findByIdAndDelete(cleanedUserId);
    
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
    
            return res.status(200).json({ message: 'User deleted successfully' });
        } catch (err) {
            console.error('Error deleting user:', err);
            return res.status(500).json({ message: 'Error deleting user', error: err });
        }
    };
    

    return {
        login,
        register,
        uploadProfileImage,
        updateUserInfo,
        getUserProfile,
        deleteUser,
    };
};

module.exports = UserController();

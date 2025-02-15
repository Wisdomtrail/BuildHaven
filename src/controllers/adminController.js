const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
require("dotenv").config();

const adminLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({
                message: 'Admin not found',
            });
        }

        const isPasswordValid = await admin.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Invalid credentials',
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: admin._id,
                email: admin.email,
                role: admin.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' } // Token expires in 1 day
        );

        // Respond with token and admin info
        res.status(200).json({
            message: 'Login successful',
            token,
            admin: {
                id: admin._id,
                fullName: admin.fullName,
                email: admin.email,
                role: admin.role,
            },
        });
    } catch (error) {
        console.error('Error during admin login:', error);
        res.status(500).json({
            message: 'Internal server error',
        });
    }
};

const createAdmin = async (req, res) => {
    const { fullName, email, password, role } = req.body;

    try {
        // Check if the admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({
                message: 'Admin with this email already exists',
            });
        }

        const newAdmin = new Admin({
            fullName,
            email,
            password,
            role,
        });

        // Save the admin to the database
        await newAdmin.save();

        res.status(201).json({
            message: 'Admin created successfully',
            admin: {
                id: newAdmin._id,
                fullName: newAdmin.fullName,
                email: newAdmin.email,
                role: newAdmin.role,
                createdAt: newAdmin.createdAt,
            },
        });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({
            message: 'Internal server error',
        });
    }
};

const getAdmin = async (req, res) => {
    const { adminId } = req.params; 
    const cleanedAdminId = adminId.startsWith(":") ? adminId.substring(1) : adminId;


    try {
        const admin = await Admin.findById(cleanedAdminId).select("profileImageUrl notifications fullName"); // Only fetch the required fields

        if (!admin) {
            return res.status(404).json({
                message: 'Admin not found',
            });
        }

        const [firstName, ...lastNameParts] = admin.fullName.split(" ");
        const lastName = lastNameParts.join(" ");

        res.status(200).json({
            message: 'Admin details retrieved successfully',
            admin: {
                id: admin._id,
                firstName,
                profileImageUrl: admin.profileImageUrl,
                notifications: admin.notifications,
            },
        });
    } catch (error) {
        console.error('Error retrieving admin details:', error);
        res.status(500).json({
            message: 'Internal server error',
        });
    }
};

module.exports = { adminLogin, createAdmin, getAdmin };

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cloudinary = require('../config/cloudinaryConfig');
const Admin = require("../models/Admin");
const Video = require("../models/Video"); 

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
                notifications: admin.notifications.filter(notification => !notification.isRead),
            },
        });

    } catch (error) {
        console.error('Error retrieving admin details:', error);
        res.status(500).json({
            message: 'Internal server error',
        });
    }
};
const uploadAdminProfileImage = async (req, res) => {
    const { adminId } = req.params;
    const file = req.file;

    const cleanedAdminId = adminId.startsWith(":") ? adminId.substring(1) : adminId;

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

                const admin = await Admin.findById(cleanedAdminId);
                if (!admin) {
                    return res.status(404).json({ message: 'Admin not found' });
                }

                admin.profileImageUrl = result.secure_url;
                await admin.save();

                return res.status(200).json({
                    message: 'Profile image uploaded successfully',
                    profileImageUrl: result.secure_url,
                });
            }
        );

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

const markAsreadNotification = async (req, res) => {
    const { adminId } = req.params; // Get adminId from URL params
    const { notificationId } = req.body; // Optional: Specific notification to mark as read

    try {
        if (!adminId) {
            return res.status(400).json({ message: "Admin ID is required." });
        }

        if (notificationId) {
            // Mark a specific notification as read
            const updatedAdmin = await Admin.findOneAndUpdate(
                { _id: adminId, "notifications._id": notificationId },
                { $set: { "notifications.$.isRead": true } }, // Update the `isRead` field of the matching notification
                { new: true } // Return the updated document
            );

            if (!updatedAdmin) {
                return res.status(404).json({ message: "Notification or Admin not found." });
            }

            return res.status(200).json({
                message: "Notification marked as read.",
                notifications: updatedAdmin.notifications
            });
        } else {
            // Mark all notifications as read
            const updatedAdmin = await Admin.findByIdAndUpdate(
                adminId,
                { $set: { "notifications.$[].isRead": true } }, // Update all `isRead` fields in notifications array
                { new: true } // Return the updated document
            );

            if (!updatedAdmin) {
                return res.status(404).json({ message: "Admin not found." });
            }

            return res.status(200).json({
                message: "All notifications marked as read.",
                notifications: updatedAdmin.notifications
            });
        }
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        return res.status(500).json({ message: "Internal Server Error." });
    }
};

const uploadNewArrivalVideoController = async (req, res) => {
    const file = req.file;
    const { adminId } = req.user; // Assuming JWT stores admin info

    if (!file) {
        return res.status(400).json({ message: "No video uploaded" });
    }

    try {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: "video",
                folder: "new_arrival_videos",
            },
            async (error, result) => {
                if (error) {
                    return res.status(500).json({ message: "Error uploading video", error });
                }

                // Save video details in the database
                const newVideo = new Video({
                    videoUrl: result.secure_url,
                    uploadedBy: adminId,
                });
                await newVideo.save();

                return res.status(200).json({
                    message: "New arrival video uploaded successfully",
                    videoUrl: result.secure_url,
                });
            }
        );

        if (file.buffer) {
            uploadStream.end(file.buffer);
        } else {
            return res.status(400).json({ message: "Invalid file format or file missing" });
        }
    } catch (err) {
        console.error("Error uploading video:", err);
        if (!res.headersSent) {
            return res.status(500).json({ message: "Video upload failed", error: err });
        }
    }
};

const getNewArrivalVideoController = async (req, res) => {
    try {
        const latestVideo = await Video.findOne().sort({ createdAt: -1 }); // Fetch the latest uploaded video
        if (!latestVideo) {
            return res.status(404).json({ message: "No new arrival video found" });
        }
        return res.status(200).json({ videoUrl: latestVideo.videoUrl });
    } catch (error) {
        console.error("Error fetching new arrival video:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = { adminLogin, createAdmin, getAdmin, uploadAdminProfileImage, markAsreadNotification, getNewArrivalVideoController, uploadNewArrivalVideoController };

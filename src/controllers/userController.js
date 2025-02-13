const User = require('../models/user');
const Product = require('../models/product');
const Order = require('../models/order');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
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
                  },
                ],
                cart: [], 
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
    const addToCart = async (req, res) => {
        const { userId } = req.params;
        const { productId, quantity } = req.body;
        const cleanedUserId = userId.startsWith(":") ? userId.substring(1) : userId;
        const cleanedProductId = productId.startsWith(":") ? productId.substring(1) : productId;
      
        try {
          const user = await User.findById(cleanedUserId);
      
          if (!user) {
            return res.status(404).json({ message: 'User not found' });
          }
      
          const product = await Product.findById(cleanedProductId);
      
          if (!product) {
            return res.status(404).json({ message: 'Product not found' });
          }
          const existingProductIndex = user.cart.findIndex(item => item.productId.toString() === cleanedProductId);
      
          if (existingProductIndex >= 0) {
            user.cart[existingProductIndex].quantity += quantity;
          } else {
            user.cart.push({ productId: cleanedProductId, quantity });
          }
          await user.save();
      
          res.status(200).json({ message: 'Product added to cart', cart: user.cart });
      
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'An error occurred while adding the product to the cart' });
        }
      };

      const getCart = async (req, res) => {
        const { userId } = req.params; 
        const cleanedUserId = userId.startsWith(":") ? userId.substring(1) : userId;
      
        try {
          const user = await User.findById(cleanedUserId);
      
          if (!user) {
            return res.status(404).json({ message: 'User not found' });
          }
          res.status(200).json({ cart: user.cart });
      
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'An error occurred while fetching the cart' });
        }
      };

      const getCartQuantity = async (req, res) => {
        const { userId } = req.params; 
        const cleanedUserId = userId.startsWith(":") ? userId.substring(1) : userId;
      
        try {
          const user = await User.findById(cleanedUserId);
      
          if (!user) {
            return res.status(404).json({ message: 'User not found' });
          }
          const totalQuantity = user.cart.reduce((total, item) => total + item.quantity, 0);
      
          res.status(200).json({ totalQuantity });
      
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'An error occurred while fetching the cart quantity' });
        }
      };

      const deleteCartItem = async (req, res) => {
        const { userId, productId } = req.params;
        const cleanedUserId = userId.startsWith(":") ? userId.substring(1) : userId;
        const cleanedProductId = productId.startsWith(":") ? productId.substring(1) : productId;
      
        try {
          const user = await User.findById(cleanedUserId);
      
          if (!user) {
            return res.status(404).json({ message: 'User not found' });
          }
      
          const productIndex = user.cart.findIndex(item => item.productId.toString() === cleanedProductId);
      
          if (productIndex === -1) {
            return res.status(404).json({ message: 'Product not found in cart' });
          }
      
          user.cart.splice(productIndex, 1);
          await user.save();
      
          res.status(200).json({ message: 'Product removed from cart', cart: user.cart });
      
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'An error occurred while removing the product from the cart' });
        }
      };

      const clearCart = async(req, res) =>{
        try {
            const { userId } = req.params;
            const cleanedUserId = userId.startsWith(":") ? userId.substring(1) : userId;
    
            const user = await User.findById(cleanedUserId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            user.cart = []; 
            await user.save();
    
            res.status(200).json({ message: "Cart cleared successfully" });
        } catch (error) {
            console.error("Error clearing cart:", error);
            res.status(500).json({ message: "Internal server error" });
        }
      }

      const getOrdersByUserId = async (req, res) => {
        try {
            const { userId } = req.params;
            const cleanedUserId = userId.startsWith(":") ? userId.substring(1) : userId;
    
            const orders = await Order.find({ userId: cleanedUserId });
    
            if (!orders.length) {
                return res.status(404).json({ message: "No orders found for this user" });
            }
    
            const ordersWithProducts = await Promise.all(orders.map(async (order) => {
                const productData = await Promise.all(order.items.map(async (item) => {
                    if (!mongoose.Types.ObjectId.isValid(item.productId)) return null;
    
                    const product = await Product.findById(item.productId, 'name price images');
    
                    return product ? { 
                        _id: product._id,
                        name: product.name, 
                        price: product.price, 
                        image: product.images?.[0] || "default.jpg", // Get first image or default
                        quantity: item.quantity
                    } : null;
                }));
    
                return {
                    orderId: order._id,
                    products: productData.filter(p => p !== null), 
                    totalAmount: order.totalAmount,
                    status: order.status,
                    orderDate: order.orderDate,
                };
            }));
    
            res.json(ordersWithProducts);
        } catch (error) {
            console.error("Error fetching orders by userId:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    };

    const deleteOrderByUserId = async (req, res) => {
        try {
            const { userId } = req.params;
            const cleanedUserId = userId.startsWith(":") ? userId.substring(1) : userId;
    
            const order = await Order.findOneAndDelete({ userId: cleanedUserId });
    
            if (!order) {
                return res.status(404).json({ message: "Order not found or does not belong to the user" });
            }
    
            res.json({ message: "Order deleted successfully" });
        } catch (error) {
            console.error("Error deleting order:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    };

    const getAllUsers = async (req, res) => {
        try {
            // Fetch all users from the database
            const users = await User.find({}, 'name email phoneNumber balance orders');
    
            if (!users.length) {
                return res.status(404).json({ message: "No users found" });
            }
    
            res.json({
                message: "Users retrieved successfully",
                users
            });
        } catch (error) {
            console.error("Error fetching all users:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    };
    
    const getAllUserCount = async (req, res) => {
        try {
            // Count the total number of users in the database
            const userCount = await User.countDocuments();
    
            res.json({
                message: "User count retrieved successfully",
                userCount
            });
        } catch (error) {
            console.error("Error fetching user count:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    };
    
    const deleteUserById = async (req, res) => {
        try {
            const { userId } = req.params;
    
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ error: 'Invalid userId format' });
            }
    
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            await Order.deleteMany({ userId });
            await User.findByIdAndDelete(userId);
    
            res.status(200).json({ message: 'User and associated orders deleted successfully' });
        } catch (error) {
            console.error('Error deleting user by ID:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };
    
          
    return {
        login,
        register,
        uploadProfileImage,
        updateUserInfo,
        getUserProfile,
        deleteUser,
        addToCart,
        getCart,
        getAllUsers,
        getAllUserCount,
        getCartQuantity,
        deleteCartItem,
        getOrdersByUserId,
        deleteUserById,
        clearCart,
        deleteOrderByUserId,
    };
};

module.exports = UserController();

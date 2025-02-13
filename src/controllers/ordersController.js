const User = require('../models/user');
const mongoose = require('mongoose');
const Product = require('../models/product');
const Order = require('../models/order');
const OrderController = {
    createOrder: async (req, res) => {
        try {
            const { userId, items, totalAmount, pickupMethod, address } = req.body;

            if (!userId || !items || items.length === 0 || !totalAmount || !pickupMethod) {
                return res.status(400).json({ error: 'User ID, items, total amount, and pickup method are required' });
            }
            if (pickupMethod === 'Delivery' && !address) {
                return res.status(400).json({ error: 'Address is required for delivery orders' });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const finalAddress = pickupMethod === 'Pickup'
                ? '175, Abeokuta Express Way, Iyana Ipaja, Lagos'
                : address;

            // Create new order
            const newOrder = new Order({
                userId,
                items,
                totalAmount,
                pickupMethod,
                address: finalAddress,
                status: 'Pending',
                active: true,
            });

            await newOrder.save();
            user.orders.push({
                orderId: newOrder._id,
                items: items,
                totalAmount: totalAmount,
                orderDate: new Date(),
                status: 'Pending',
            });

            await user.save();

            res.status(201).json({
                message: 'Order created successfully',
                order: newOrder,
            });
        } catch (error) {
            console.error('Error creating order:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },


    getOrderById: async (req, res) => {
        try {
            const { orderId } = req.params;

            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ message: "Order not found" });
            }

            const productIds = order.products.map(p => p.productId);
            const products = await Product.find({ _id: { $in: productIds } }, 'name price image');

            res.json({
                orderId: order._id,
                products,
                totalAmount: order.totalAmount,
                status: order.status,
                createdAt: order.createdAt
            });

        } catch (error) {
            console.error("Error fetching order by orderId:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    getAllOrders: async (req, res) => {
        try {
            const orders = await Order.find();

            if (!orders.length) {
                return res.status(404).json({ message: "No orders found" });
            }

            const ordersWithProducts = await Promise.all(orders.map(async (order) => {
                const productIds = order.products.map(p => p.productId);
                const products = await Product.find({ _id: { $in: productIds } }, 'name price image');

                return {
                    orderId: order._id,
                    userId: order.userId,
                    products,
                    totalAmount: order.totalAmount,
                    status: order.status,
                    createdAt: order.createdAt
                };
            }));

            res.json(ordersWithProducts);
        } catch (error) {
            console.error("Error fetching all orders:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    deleteAllOrdersByUserId: async (req, res) => {
        try {
            let { userId } = req.params;
    
            // Remove any leading ":" if present
            userId = userId.startsWith(":") ? userId.slice(1) : userId;
    
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ error: 'Invalid userId format' });
            }
    
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
    
            await Order.deleteMany({ userId });
    
            user.orders = [];
            await user.save();
    
            res.status(200).json({ message: 'All orders for the user have been deleted' });
        } catch (error) {
            console.error('Error deleting orders:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    
    getOrdersThisWeek: async (req, res) => {
        try {
            // Calculate the start of the week (7 days ago)
            const today = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(today.getDate() - 7);
    
            // Find orders created within the last 7 days
            const orders = await Order.find({
                orderDate: {
                    $gte: sevenDaysAgo, // Greater than or equal to 7 days ago
                    $lte: today // Less than or equal to today
                }
            });
    
            if (!orders.length) {
                return res.status(404).json({ message: "No orders found for this week" });
            }
    
            // Fetch product and user details for each order
            const ordersWithProducts = await Promise.all(
                orders.map(async (order) => {
                    const productIds = order.items.map(item => item.productId); // Use items instead of products
                    
                    // Fetch product details for the items in the order
                    const products = await Product.find(
                        { _id: { $in: productIds } },
                        'name price image' // Select relevant fields
                    );
    
                    // Fetch user details
                    const user = await User.findById(order.userId, 'firstName lastName'); // Fetch firstName and lastName
    
                    return {
                        orderId: order._id,
                        userId: order.userId,
                        fullname: user ? `${user.firstName} ${user.lastName}` : "Unknown User", // Construct fullname
                        products: products.map(product => ({
                            ...product.toObject(),
                            quantity: order.items.find(item => item.productId === product._id.toString())?.quantity || 1,
                        })),
                        totalAmount: order.totalAmount,
                        status: order.status,
                        orderDate: order.orderDate,
                        pickupMethod: order.pickupMethod,
                        address: order.address,
                    };
                })
            );
    
            res.json(ordersWithProducts);
        } catch (error) {
            console.error("Error fetching orders for this week:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
        
    getOrderCountThisWeek: async (req, res) => {
        try {
            // Calculate the start of the week (7 days ago)
            const today = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(today.getDate() - 7);
    
            // Count orders created within the last 7 days
            const orderCount = await Order.countDocuments({
                orderDate: {
                    $gte: sevenDaysAgo, // Greater than or equal to 7 days ago
                    $lte: today // Less than or equal to today
                }
            });
    
            // Return the count
            res.json({
                message: "Order count for this week retrieved successfully",
                orderCount
            });
        } catch (error) {
            console.error("Error fetching order count for this week:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },    
};

module.exports = OrderController;

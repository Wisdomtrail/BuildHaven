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
    
            // Validate if userId is a valid MongoDB ObjectId
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
    }    

};

module.exports = OrderController;

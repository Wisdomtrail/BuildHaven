const User = require('../models/user');
const mongoose = require('mongoose');
const Product = require('../models/product');
const Order = require('../models/order');
const Admin = require('../models/Admin');

const nodemailer = require("nodemailer");

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

            // Add notification to user
            user.notifications.push({
                message: `Your order has been placed successfully! Order ID: ${newOrder._id}.`,
                type: 'success',
                isRead: false,
                timestamp: new Date(),
            });

            await user.save();

            // Retrieve all admins
            const admins = await Admin.find();
            const notificationMessage = `New order placed by user ${user.firstName} ${user.lastName || user.email}. Order ID: ${newOrder._id}.`;

            // Save admin notifications
            const adminNotifications = admins.map(async (admin) => {
                admin.notifications.push({
                    message: notificationMessage,
                    type: 'info',
                    isRead: false,
                    timestamp: new Date(),
                });
                await admin.save();
            });

            await Promise.all(adminNotifications);

            const adminEmails = admins.map(admin => admin.email); // Assuming each admin has an email field

            const transporter = nodemailer.createTransport({
                service: "gmail", 
                auth: {
                    user: 'sunepa091522@gmail.com',
                    pass: 'buny khlr rzxj rcai'
                },
            });

            const mailOptions = {
                from: `"BuildHaven" <noreply@buildhaven.com>`, // Display name and email
                to: adminEmails.join(","),
                subject: "New Order Notification",
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <h2 style="color: #FD8F00;">New Order Notification</h2>
                        <p style="font-size: 16px;">
                            A new order has been placed by user 
                            <strong>${user.firstName} ${user.lastName || user.email}</strong>.
                        </p>
                        <p style="font-size: 16px;">
                            <strong>Order ID:</strong> ${newOrder._id}
                        </p>
                        <p style="font-size: 16px;">Thank you for using BuildHaven!</p>
                    </div>
                `,
            };            

            await transporter.sendMail(mailOptions);

            res.status(201).json({
                message: 'Order created successfully. Notifications sent to user and admins via email.',
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
            const today = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(today.getDate() - 7);

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

    deleteOrder: async (req, res) => {
        try {
            const { orderId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                return res.status(400).json({ error: 'Invalid orderId format' });
            }

            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }

            // Remove the order from the user's order history
            const user = await User.findById(order.userId);
            if (user) {
                user.orders = user.orders.filter(order => order.orderId.toString() !== orderId);
                await user.save();
            }

            // Delete the order
            await Order.findByIdAndDelete(orderId);

            res.status(200).json({ message: 'Order deleted successfully' });
        } catch (error) {
            console.error('Error deleting order:', error);
            res.status(500).json({ error: 'Internal server error' });
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

    deleteAllOrders: async (req, res) => {
        try {
            await Order.deleteMany({}); // Delete all orders
            res.status(200).json({
                message: "All orders deleted successfully",
            });
        } catch (error) {
            console.error("Error deleting all orders:", error);
            res.status(500).json({
                message: "Internal server error",
            });
        }
    },

    getPendingOrders: async (req, res) => {
        try {
            // Find all orders with status 'Pending'
            const pendingOrders = await Order.find({ status: 'Pending' });

            if (!pendingOrders.length) {
                return res.status(404).json({ message: "No pending orders found" });
            }

            // Fetch product and user details for each pending order
            const ordersWithProducts = await Promise.all(pendingOrders.map(async (order) => {
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
            }));

            res.json(ordersWithProducts);
        } catch (error) {
            console.error("Error fetching pending orders:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },


    viewOrderDetails: async (req, res) => {
        try {
            let { orderId } = req.params;

            // Check if the orderId is valid (24 characters hex string)
            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                return res.status(400).json({ message: "Invalid order ID format" });
            }

            // Fetch the order from the database
            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ message: "Order not found" });
            }

            // Fetch products related to the order
            const productIds = order.items.map(item => item.productId);
            const products = await Product.find({ _id: { $in: productIds } });

            // Prepare product details
            const productsWithDetails = products.map(product => {
                const productDetails = order.items.find(item => item.productId.toString() === product._id.toString());
                return {
                    productId: product._id,
                    name: product.name,
                    price: product.price,
                    image: product.images && product.images.length > 0 ? product.images[0] : null,
                    quantity: productDetails.quantity,
                    description: product.description,
                    category: product.category,
                    stock: product.stock,
                };
            });

            // Send the order details with product information to the client
            res.json({
                orderId: order._id,
                userId: order.userId,
                products: productsWithDetails,
                totalAmount: order.totalAmount,
                status: order.status,
                createdAt: order.createdAt,
                pickupMethod: order.pickupMethod,
                address: order.address,
                orderDate: order.orderDate,
            });

        } catch (error) {
            console.error("Error fetching order details:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    approveOrder: async (req, res) => {
        try {
            const { orderId } = req.params;
            const order = await Order.findById(orderId);
    
            if (!order) {
                return res.status(404).json({ message: "Order not found" });
            }
    
            if (order.status === "Cancelled") {
                return res.status(400).json({ message: "Cannot approve a cancelled order" });
            }
    
            // Process item quantities and update stock
            for (const item of order.items) {
                const product = await Product.findById(item.productId);
                if (!product) {
                    return res.status(404).json({ message: `Product not found` });
                }
                if (product.quantity < item.quantity) {
                    return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
                }
    
                product.quantity -= item.quantity; // Update product stock
                await product.save();
            }
    
            // Update order status to completed
            order.status = "Completed";
            order.active = false;
            await order.save();
    
            // Notify user about order approval
            const user = await User.findById(order.userId);
            user.notifications.push({
                message: `Your order with ID ${order._id} has been completed.`,
                type: "success",
                isRead: false,
                timestamp: new Date(),
            });
            await user.save();
    
            // Send email notification to the user
            const nodemailer = require("nodemailer");
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: "sunepa091522@gmail.com", // Your email
                    pass: "buny khlr rzxj rcai", // Your email password
                },
            });
    
            const mailOptions = {
                from: `"BuildHaven" <sunepa091522@gmail.com>`,
                to: user.email,
                subject: "Order Approved",
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <h2 style="color: #4CAF50;">Order Approved</h2>
                        <p>Dear ${user.firstName},</p>
                        <p>Your order with ID <strong>${order._id}</strong> has been successfully approved and completed.</p>
                        <p>Thank you for shopping with BuildHaven!</p>
                    </div>
                `,
            };
    
            await transporter.sendMail(mailOptions);
    
            res.status(200).json({ message: "Order approved, products updated, and email sent to user.", order });
        } catch (error) {
            console.error("Error approving order:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
    
    cancelOrder: async (req, res) => {
        try {
            const { orderId } = req.params;
            const order = await Order.findById(orderId);
    
            if (!order) {
                return res.status(404).json({ message: "Order not found" });
            }
    
            if (order.status === "Completed") {
                return res.status(400).json({ message: "Cannot cancel a completed order" });
            }
    
            // Update order status to cancelled
            order.status = "Cancelled";
            order.active = false;
            await order.save();
    
            // Notify user about order cancellation
            const user = await User.findById(order.userId);
            user.notifications.push({
                message: `Your order with ID ${order._id} has been cancelled.`,
                type: "warning",
                isRead: false,
                timestamp: new Date(),
            });
            await user.save();
    
            // Send email notification to the user
            const nodemailer = require("nodemailer");
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: "sunepa091522@gmail.com", // Your email
                    pass: "buny khlr rzxj rcai", // Your email password
                },
            });
    
            const mailOptions = {
                from: `"BuildHaven" <sunepa091522@gmail.com>`,
                to: user.email,
                subject: "Order Cancelled",
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <h2 style="color: #FF5733;">Order Cancelled</h2>
                        <p>Dear ${user.firstName},</p>
                        <p>We regret to inform you that your order with ID <strong>${order._id}</strong> has been cancelled.</p>
                        <p>If you have any questions, please contact us at support@buildhaven.com.</p>
                    </div>
                `,
            };
    
            await transporter.sendMail(mailOptions);
    
            res.status(200).json({ message: "Order cancelled, and email sent to user.", order });
        } catch (error) {
            console.error("Error cancelling order:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
    
};

module.exports = OrderController;

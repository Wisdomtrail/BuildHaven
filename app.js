const express = require('express');
const cors = require('cors');  
const cron = require('node-cron'); // Import node-cron
const app = express();
const productRoutes = require('./src/routes/productRoutes'); 
const userRoutes = require('./src/routes/userRoutes');  
const publicRoutes = require('./src/routes/publicRoutes')
require('./src/config/db');
const Order = require('./src/models/order');  
require('./src/config/passport');
const PORT = 3001;

const cleanupOldPickupOrders = async () => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const result = await Order.deleteMany({
            pickupMethod: 'Pickup',
            orderDate: { $lt: sevenDaysAgo },
            active: true,
            status: 'Pending',
        });

        console.log(`Deleted ${result.deletedCount} old pickup orders.`);
    } catch (error) {
        console.error('Error cleaning up old pickup orders:', error);
    }
};

cron.schedule('0 0 * * *', async () => {
    console.log('Running cleanup job for expired pickup orders');
    await cleanupOldPickupOrders();
});

app.use(cors());
app.use(express.json());

app.use('/product', productRoutes);  

app.use('/public-route', publicRoutes);  
app.use('/user', userRoutes);  

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const Product = require('../models/product');
const cloudinary = require('../config/cloudinaryConfig');

const ProductController = () => {

    const createProduct = async (req, res) => {
        const files = req.files;
        const { name, description, price, category, quantity } = req.body;
    
        if (!name || !description || !price || !category || !files || files.length === 0) {
            return res.status(400).json({
                error: "All fields are required, and at least one image must be uploaded.",
            });
        }
    
        try {
            const imageUrls = [];
    
            for (const file of files) {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { 
                        resource_type: 'auto', 
                        folder: 'product_images'
                    },
                    (error, result) => {
                        if (error) {
                            return res.status(500).json({ message: 'Error uploading image', error });
                        }
                        imageUrls.push(result.secure_url);
    
                        if (imageUrls.length === files.length) {
                            const product = new Product({
                                name,
                                description,
                                price,
                                quantity,
                                category,
                                images: imageUrls,
                            });
    
                            product.save()
                                .then(savedProduct => {
                                    return res.status(201).json({
                                        message: "Product created successfully",
                                        product: savedProduct,
                                    });
                                })
                                .catch(saveError => {
                                    console.error(saveError);
                                    return res.status(500).json({
                                        error: "Failed to save the product",
                                    });
                                });
                        }
                    }
                );
                if (file && file.buffer) {
                    uploadStream.end(file.buffer);
                } else {
                    return res.status(400).json({ message: 'Invalid file format or file missing' });
                }
            }
        } catch (err) {
            console.error('Error uploading product images:', err);
            if (!res.headersSent) {
                return res.status(500).json({ message: 'Image upload failed', error: err });
            }
        }
    };

    const getAllProducts = async (req, res) => {
        try {
            const products = await Product.find();
            return res.status(200).json({
                message: "Products retrieved successfully",
                products,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: "Server error. Please try again later.",
            });
        }
    };

    const getProductById = async (req, res) => {
        const { id } = req.params;
        const cleanedProductId = id.startsWith(":") ? id.substring(1) : id;

        try {
            const product = await Product.findById(cleanedProductId);
            if (!product) {
                return res.status(404).json({
                    message: "Product not found",
                });
            }
            return res.status(200).json({
                message: "Product retrieved successfully",
                product,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: "Server error. Please try again later.",
            });
        }
    };

    const updateProduct = async (req, res) => {
        const { id } = req.params;
        const { name, description, price, category, images } = req.body;
        const cleanedProductId = id.startsWith(":") ? id.substring(1) : id;
    
        try {
            const product = await Product.findById(cleanedProductId);
            if (!product) {
                return res.status(404).json({
                    message: "Product not found",
                });
            }
    
            product.name = name || product.name;
            product.description = description || product.description;
            product.price = price || product.price;
            product.category = category || product.category;
            product.images = images || product.images; // Optionally update images
    
            const updatedProduct = await product.save();
    
            return res.status(200).json({
                message: "Product updated successfully",
                product: updatedProduct,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: "Server error. Please try again later.",
            });
        }
    };

    const getProductsByCategory = async (req, res) => {
        const { category } = req.params;
    
        const cleanedCategory = category.startsWith(":") ? category.substring(1) : category;
    
        try {
            const products = await Product.find({ category: cleanedCategory });
            return res.status(200).json({
                message: "Products retrieved successfully",
                products,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: "Server error. Please try again later.",
            });
        }
    };
    

    const deleteProduct = async (req, res) => {
        const { id } = req.params;

        const cleanedProductId = id.startsWith(":") ? id.substring(1) : id;

        try {
            const product = await Product.findByIdAndDelete(cleanedProductId);
            if (!product) {
                return res.status(404).json({
                    message: "Product not found",
                });
            }
            return res.status(200).json({
                message: "Product deleted successfully",
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: "Server error. Please try again later.",
            });
        }
    };
    
    const markAsSold = async (req, res) => {
        const { id } = req.params;
        const cleanedProductId = id.startsWith(":") ? id.substring(1) : id;

        try {
            const product = await Product.findById(cleanedProductId);
            if (!product) {
                return res.status(404).json({
                    message: "Product not found",
                });
            }
    
            product.isSold = true;
            const updatedProduct = await product.save();
    
            return res.status(200).json({
                message: "Product marked as sold",
                product: updatedProduct,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: "Server error. Please try again later.",
            });
        }
    };
    
    const getProductCount = async (req, res) => {
        try {
            const count = await Product.countDocuments();
            return res.status(200).json({
                message: "Product count retrieved successfully",
                count,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: "Server error. Please try again later.",
            });
        }
    };
    
    const getRecentProducts = async (req, res) => {
        const { days } = req.query;
        const date = new Date();
        date.setDate(date.getDate() - days);
    
        try {
            const products = await Product.find({ createdAt: { $gte: date } });
            return res.status(200).json({
                message: "Recently added products retrieved successfully",
                products,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: "Server error. Please try again later.",
            });
        }
    };

    const editProductById = async (req, res) => {
        try {
          const { id } = req.params;
          const { quantity } = req.body;
      
          if (quantity && typeof quantity !== 'number') {
            return res.status(400).json({ message: 'Quantity must be a number' });
          }
      
          const product = await Product.findById(id);
          if (!product) {
            return res.status(404).json({ message: 'Product not found' });
          }
      
          if (quantity !== undefined) {
            product.quantity = quantity;
          }
          const updatedProduct = await product.save();
      
          res.json(updatedProduct);
        } catch (error) {
          res.status(500).json({ message: 'Server Error', error });
        }
      };      
      
    
    return {
        createProduct,
        getAllProducts,
        getProductById,
        updateProduct,
        getProductsByCategory,
        deleteProduct,
        markAsSold,
        getProductCount,
        getRecentProducts,
        editProductById,
    };
}
module.exports = ProductController();
const { supabase } = require('../config/supabase');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const { category, min_price, max_price, search } = req.query;
    
    // Start with base query
    let query = supabase
      .from('products')
      .select('*, categories(name)');
    
    // Apply filters if they exist
    if (category) {
      query = query.eq('category_id', category);
    }
    
    if (min_price) {
      query = query.gte('price', min_price);
    }
    
    if (max_price) {
      query = query.lte('price', max_price);
    }
    
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    // Execute query
    const { data: products, error } = await query;
    
    if (error) {
      console.error('Product fetch error:', error);
      return res.status(500).json({ message: 'Error fetching products' });
    }
    
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: product, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('id', id)
      .single();
    
    if (error || !product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Search products
// @route   GET /api/products/search/:keyword
// @access  Public
const searchProducts = async (req, res) => {
  try {
    const { keyword } = req.params;
    
    if (!keyword) {
      return res.status(400).json({ message: 'Keyword is required' });
    }
    
    const { data: products, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .ilike('name', `%${keyword}%`)
      .or(`description.ilike.%${keyword}%`);
    
    if (error) {
      console.error('Search error:', error);
      return res.status(500).json({ message: 'Error searching products' });
    }
    
    res.json(products);
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price, 
      image_url, 
      stock, 
      category_id 
    } = req.body;
    
    if (!name || !price || !category_id) {
      return res.status(400).json({ message: 'Please provide required fields' });
    }
    
    const { data: product, error } = await supabase
      .from('products')
      .insert([
        {
          name,
          description: description || '',
          price,
          image_url: image_url || '',
          stock: stock || 0,
          category_id
        }
      ])
      .select();
    
    if (error) {
      console.error('Product creation error:', error);
      return res.status(400).json({ message: 'Could not create product' });
    }
    
    res.status(201).json(product[0]);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      price, 
      image_url, 
      stock, 
      category_id 
    } = req.body;
    
    // Check if product exists
    const { data: existingProduct } = await supabase
      .from('products')
      .select()
      .eq('id', id)
      .single();
    
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Prepare update data
    const updateData = {
      name: name || existingProduct.name,
      description: description !== undefined ? description : existingProduct.description,
      price: price || existingProduct.price,
      image_url: image_url !== undefined ? image_url : existingProduct.image_url,
      stock: stock !== undefined ? stock : existingProduct.stock,
      category_id: category_id || existingProduct.category_id
    };
    
    // Update product
    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Product update error:', error);
      return res.status(400).json({ message: 'Could not update product' });
    }
    
    res.json(updatedProduct[0]);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if product exists
    const { data: existingProduct } = await supabase
      .from('products')
      .select()
      .eq('id', id)
      .single();
    
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Delete product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Product deletion error:', error);
      return res.status(400).json({ message: 'Could not delete product' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct
}; 
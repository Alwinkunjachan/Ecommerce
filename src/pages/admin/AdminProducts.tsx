import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, X, Upload, Image } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { compressImage } from '@/lib/imageCompression';

type Product = {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  category: string;
  image_url: string | null;
  is_active: boolean;
};

type Variant = {
  id?: string;
  size: string;
  color: string;
  stock_quantity: number;
  price_adjustment: number;
};

type ProductImage = {
  id?: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
  file?: File;
  preview?: string;
};

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const DEFAULT_COLORS = ['Black', 'White', 'Navy', 'Gray', 'Red', 'Blue', 'Green'];

const AdminProducts = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    category: 'shirts',
    image_url: '',
    is_active: true,
  });
  const [variants, setVariants] = useState<Variant[]>([]);
  const [newVariant, setNewVariant] = useState<Variant>({
    size: '',
    color: '',
    stock_quantity: 10,
    price_adjustment: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Product[];
    },
    enabled: isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { product: any; variants: Variant[]; images: ProductImage[] }) => {
      // Create product
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert([data.product])
        .select()
        .single();
      
      if (productError) throw productError;

      // Create variants
      if (data.variants.length > 0) {
        const variantsToInsert = data.variants.map(v => ({
          product_id: newProduct.id,
          size: v.size,
          color: v.color,
          stock_quantity: v.stock_quantity,
          price_adjustment: v.price_adjustment,
        }));
        
        const { error: variantError } = await supabase
          .from('product_variants')
          .insert(variantsToInsert);
        
        if (variantError) throw variantError;
      }

      // Create product images
      if (data.images.length > 0) {
        const imagesToInsert = data.images.map(img => ({
          product_id: newProduct.id,
          image_url: img.image_url,
          display_order: img.display_order,
          is_primary: img.is_primary,
        }));
        
        const { error: imageError } = await supabase
          .from('product_images')
          .insert(imagesToInsert);
        
        if (imageError) throw imageError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: 'Product created successfully' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Create error:', error);
      toast({ title: 'Failed to create product', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, variants: newVariants, images }: { id: string; data: any; variants: Variant[]; images: ProductImage[] }) => {
      // Update product
      const { error: productError } = await supabase
        .from('products')
        .update(data)
        .eq('id', id);
      
      if (productError) throw productError;

      // Delete existing variants
      const { error: deleteVariantError } = await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', id);
      
      if (deleteVariantError) throw deleteVariantError;

      // Insert new variants
      if (newVariants.length > 0) {
        const variantsToInsert = newVariants.map(v => ({
          product_id: id,
          size: v.size,
          color: v.color,
          stock_quantity: v.stock_quantity,
          price_adjustment: v.price_adjustment,
        }));
        
        const { error: variantError } = await supabase
          .from('product_variants')
          .insert(variantsToInsert);
        
        if (variantError) throw variantError;
      }

      // Delete existing images
      const { error: deleteImageError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', id);
      
      if (deleteImageError) throw deleteImageError;

      // Insert new images
      if (images.length > 0) {
        const imagesToInsert = images.map(img => ({
          product_id: id,
          image_url: img.image_url,
          display_order: img.display_order,
          is_primary: img.is_primary,
        }));
        
        const { error: imageError } = await supabase
          .from('product_images')
          .insert(imagesToInsert);
        
        if (imageError) throw imageError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: 'Product updated successfully' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast({ title: 'Failed to update product', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: 'Product deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete product', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      base_price: '',
      category: 'shirts',
      image_url: '',
      is_active: true,
    });
    setVariants([]);
    setNewVariant({
      size: '',
      color: '',
      stock_quantity: 10,
      price_adjustment: 0,
    });
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview(null);
    setProductImages([]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Please select an image file', variant: 'destructive' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Image must be less than 5MB', variant: 'destructive' });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleMultipleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: ProductImage[] = [];
      Array.from(files).forEach((file, index) => {
        if (!file.type.startsWith('image/')) {
          toast({ title: `${file.name} is not an image`, variant: 'destructive' });
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast({ title: `${file.name} is too large (max 5MB)`, variant: 'destructive' });
          return;
        }
        newImages.push({
          image_url: '',
          display_order: productImages.length + index,
          is_primary: productImages.length === 0 && index === 0,
          file,
          preview: URL.createObjectURL(file),
        });
      });
      setProductImages([...productImages, ...newImages]);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    // Compress image before upload
    const compressedFile = await compressImage(file, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.85,
      maxSizeKB: 300,
    });

    const fileExt = 'jpg'; // Always use jpg after compression
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, compressedFile);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const removeProductImage = (index: number) => {
    const newImages = productImages.filter((_, i) => i !== index);
    // If we removed the primary image, set the first one as primary
    if (productImages[index].is_primary && newImages.length > 0) {
      newImages[0].is_primary = true;
    }
    // Recalculate display order
    newImages.forEach((img, i) => {
      img.display_order = i;
    });
    setProductImages(newImages);
  };

  const setPrimaryImage = (index: number) => {
    const newImages = productImages.map((img, i) => ({
      ...img,
      is_primary: i === index,
    }));
    setProductImages(newImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (variants.length === 0) {
      toast({ title: 'Please add at least one variant (size/color)', variant: 'destructive' });
      return;
    }

    setIsUploading(true);

    try {
      // Upload main image if selected
      let imageUrl = formData.image_url;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      // Upload all product images
      const uploadedImages: ProductImage[] = [];
      for (const img of productImages) {
        if (img.file) {
          const uploadedUrl = await uploadImage(img.file);
          uploadedImages.push({
            image_url: uploadedUrl,
            display_order: img.display_order,
            is_primary: img.is_primary,
          });
        } else if (img.image_url) {
          uploadedImages.push({
            image_url: img.image_url,
            display_order: img.display_order,
            is_primary: img.is_primary,
          });
        }
      }

      const productData = {
        ...formData,
        image_url: imageUrl || (uploadedImages.find(i => i.is_primary)?.image_url || uploadedImages[0]?.image_url || ''),
        base_price: parseFloat(formData.base_price),
      };

      if (editingProduct) {
        updateMutation.mutate({ id: editingProduct.id, data: productData, variants, images: uploadedImages });
      } else {
        createMutation.mutate({ product: productData, variants, images: uploadedImages });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Failed to upload images', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = async (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      base_price: product.base_price.toString(),
      category: product.category,
      image_url: product.image_url || '',
      is_active: product.is_active,
    });

    // Fetch variants for this product
    const { data: productVariants, error: variantsError } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', product.id);

    if (!variantsError && productVariants) {
      setVariants(productVariants.map(v => ({
        id: v.id,
        size: v.size,
        color: v.color,
        stock_quantity: v.stock_quantity,
        price_adjustment: Number(v.price_adjustment),
      })));
    }

    // Fetch images for this product
    const { data: existingImages, error: imagesError } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', product.id)
      .order('display_order');

    if (!imagesError && existingImages) {
      setProductImages(existingImages.map(img => ({
        id: img.id,
        image_url: img.image_url,
        display_order: img.display_order,
        is_primary: img.is_primary,
      })));
    }

    setIsDialogOpen(true);
  };

  const addVariant = () => {
    if (!newVariant.size || !newVariant.color) {
      toast({ title: 'Please select size and color', variant: 'destructive' });
      return;
    }

    // Check for duplicate
    const exists = variants.some(v => v.size === newVariant.size && v.color === newVariant.color);
    if (exists) {
      toast({ title: 'This size/color combination already exists', variant: 'destructive' });
      return;
    }

    setVariants([...variants, { ...newVariant }]);
    setNewVariant({
      size: '',
      color: '',
      stock_quantity: 10,
      price_adjustment: 0,
    });
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Product Management</h1>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="base_price">Base Price</Label>
                  <Input
                    id="base_price"
                    type="number"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shirts">Shirts</SelectItem>
                      <SelectItem value="pants">Pants</SelectItem>
                      <SelectItem value="outerwear">Outerwear</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Multiple Images Upload Section */}
                <div className="space-y-3 border-t pt-4">
                  <Label className="text-lg font-semibold">Product Images (Gallery)</Label>
                  <p className="text-sm text-muted-foreground">Upload multiple images. Click the star to set as primary image.</p>
                  
                  {/* Image Grid */}
                  {productImages.length > 0 && (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {productImages.map((img, index) => (
                        <div key={index} className="relative aspect-square border rounded-lg overflow-hidden group">
                          <img 
                            src={img.preview || img.image_url} 
                            alt={`Product image ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                          {img.is_primary && (
                            <Badge className="absolute top-1 left-1 text-xs">Primary</Badge>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setPrimaryImage(index)}
                              title="Set as primary"
                            >
                              ★
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => removeProductImage(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Button */}
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={multiFileInputRef}
                      accept="image/*"
                      multiple
                      onChange={handleMultipleImagesChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => multiFileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Add Images
                    </Button>
                  </div>
                </div>

                {/* Legacy single image section (optional fallback) */}
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">Or use a single image URL (legacy)</Label>
                  <Input
                    id="image_url"
                    placeholder="https://example.com/image.jpg"
                    value={formData.image_url}
                    onChange={(e) => {
                      setFormData({ ...formData, image_url: e.target.value });
                    }}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                {/* Variants Section */}
                <div className="border-t pt-4 mt-4">
                  <Label className="text-lg font-semibold">Product Variants (Size/Color/Stock)</Label>
                  <p className="text-sm text-muted-foreground mb-4">Add at least one variant for customers to purchase</p>
                  
                  {/* Add Variant Form */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                    <Select value={newVariant.size} onValueChange={(value) => setNewVariant({ ...newVariant, size: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Size" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_SIZES.map(size => (
                          <SelectItem key={size} value={size}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={newVariant.color} onValueChange={(value) => setNewVariant({ ...newVariant, color: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Color" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_COLORS.map(color => (
                          <SelectItem key={color} value={color}>{color}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Stock"
                      value={newVariant.stock_quantity}
                      onChange={(e) => setNewVariant({ ...newVariant, stock_quantity: parseInt(e.target.value) || 0 })}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Price +/-"
                      value={newVariant.price_adjustment}
                      onChange={(e) => setNewVariant({ ...newVariant, price_adjustment: parseFloat(e.target.value) || 0 })}
                    />
                    <Button type="button" onClick={addVariant} variant="secondary">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Variants List */}
                  {variants.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Size</TableHead>
                            <TableHead>Color</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Price Adj.</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {variants.map((variant, index) => (
                            <TableRow key={index}>
                              <TableCell>{variant.size}</TableCell>
                              <TableCell>{variant.color}</TableCell>
                              <TableCell>{variant.stock_quantity}</TableCell>
                              <TableCell>${variant.price_adjustment.toFixed(2)}</TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeVariant(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {variants.length === 0 && (
                    <p className="text-sm text-destructive">No variants added yet. Add at least one.</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending || isUploading}>
                  {isUploading ? 'Uploading Image...' : editingProduct ? 'Update Product' : 'Create Product'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>${product.base_price.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(product.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminProducts;

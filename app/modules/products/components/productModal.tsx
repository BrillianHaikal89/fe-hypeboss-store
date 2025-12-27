"use client";

import { useState, useEffect } from "react";
import { X, Upload, Loader2, AlertCircle, Package, TestTube } from "lucide-react";

interface Product {
  id?: number;
  name: string;
  description: string;
  category_id: number;
  price: string;
  discount_price: string;
  stock: number;
  image: string;
  is_featured: boolean;
  is_active: boolean;
}

interface Category {
  id: number;
  name: string;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSave: () => void;
  onTestStockReduction?: (productId: number) => void;
}

export default function ProductModal({ isOpen, onClose, product, onSave, onTestStockReduction }: ProductModalProps) {
  const API_BASE_URL = "http://localhost:3001/api";
  
  const [formData, setFormData] = useState<Product>({
    name: "",
    description: "",
    category_id: 0,
    price: "",
    discount_price: "",
    stock: 0,
    image: "",
    is_featured: false,
    is_active: true,
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isTestingStock, setIsTestingStock] = useState(false);

  // Load categories on mount
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (product) {
        setFormData(product);
        if (product.image) {
          setImagePreview(product.image);
        }
      } else {
        resetForm();
      }
    }
  }, [isOpen, product]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories?status=true`);
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data || []);
        if (data.data.length > 0 && !product) {
          setFormData(prev => ({
            ...prev,
            category_id: data.data[0].id
          }));
        }
      } else {
        throw new Error(data.message || "Failed to fetch categories");
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Gagal memuat kategori");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category_id: 0,
      price: "",
      discount_price: "",
      stock: 0,
      image: "",
      is_featured: false,
      is_active: true,
    });
    setImageFile(null);
    setImagePreview("");
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === "price" || name === "discount_price") {
      // Hapus karakter non-numeric kecuali titik
      const numericValue = value.replace(/[^\d.]/g, '');
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else if (name === "stock") {
      // Hanya angka untuk stok
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: parseInt(numericValue) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, image: "" })); // Reset image URL jika upload file baru
    }
  };

  // Fungsi handleSubmit yang hilang
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Append form data
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("category_id", formData.category_id.toString());
      formDataToSend.append("price", formData.price);
      formDataToSend.append("discount_price", formData.discount_price);
      formDataToSend.append("stock", formData.stock.toString());
      formDataToSend.append("is_featured", formData.is_featured.toString());
      formDataToSend.append("is_active", formData.is_active.toString());

      // Append image if exists
      if (imageFile) {
        formDataToSend.append("image", imageFile);
      } else if (formData.image) {
        formDataToSend.append("image_url", formData.image);
      }

      const url = product?.id 
        ? `${API_BASE_URL}/products/${product.id}`
        : `${API_BASE_URL}/products`;
      
      const method = product?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        onSave();
        onClose();
        resetForm();
      } else {
        throw new Error(data.message || "Failed to save product");
      }
    } catch (err: any) {
      console.error("Error saving product:", err);
      setError(err.message || "Gagal menyimpan produk");
    } finally {
      setLoading(false);
    }
  };

  // Format currency for display
  const formatCurrency = (amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  // Handle test stock reduction
  const handleTestStockReduction = async () => {
    if (!product?.id) return;
    
    setIsTestingStock(true);
    try {
      const response = await fetch(`${API_BASE_URL}/orders/test-stock/${product.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          quantity: 2,
          action: 'test'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setError(null);
        if (onTestStockReduction) {
          onTestStockReduction(product.id);
        }
        alert('✅ Testing pengurangan stok berhasil!\n\n' + 
              `Stok sebelumnya: ${data.data.stock_before}\n` +
              `Stok setelahnya: ${data.data.stock_after}\n` +
              `Pengurangan: ${data.data.reduction_amount}`);
      } else {
        throw new Error(data.message || 'Gagal testing stok');
      }
    } catch (err: any) {
      console.error('Error testing stock reduction:', err);
      setError(err.message || 'Gagal melakukan testing stok');
    } finally {
      setIsTestingStock(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300">
            {/* Header */}
            <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {product ? "Edit Produk" : "Tambah Produk Baru"}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-700 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-red-900 text-sm font-medium">{error}</span>
                </div>
              )}

              {/* Image Upload */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Gambar Produk
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 transition-colors bg-gray-50">
                  {imagePreview ? (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview("");
                          setImageFile(null);
                          setFormData(prev => ({ ...prev, image: "" }));
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-700 mb-2 font-medium">
                        Klik untuk upload gambar
                      </p>
                      <p className="text-xs text-gray-600 mb-3">
                        PNG, JPG, JPEG (max. 2MB)
                      </p>
                      <input
                        type="file"
                        id="image-upload"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="image-upload"
                        className="inline-block px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer font-medium shadow-sm"
                      >
                        Pilih Gambar
                      </label>
                    </>
                  )}
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Nama Produk *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
                    placeholder="Masukkan nama produk"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Kategori *
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
                    required
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Deskripsi
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
                  placeholder="Masukkan deskripsi produk"
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Harga Normal *
                  </label>
                  <input
                    type="text"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
                    placeholder="0"
                    required
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    {formData.price && formatCurrency(formData.price)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Harga Diskon
                  </label>
                  <input
                    type="text"
                    name="discount_price"
                    value={formData.discount_price}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
                    placeholder="0 (opsional)"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    {formData.discount_price && formatCurrency(formData.discount_price)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Stok *
                  </label>
                  <input
                    type="text"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-6 mb-6">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm font-semibold text-gray-900">
                    Jadikan Produk Unggulan
                  </span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm font-semibold text-gray-900">
                    Aktifkan Produk
                  </span>
                </label>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between gap-3">
                <div className="flex space-x-3">
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 border border-gray-300 text-gray-900 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                    disabled={loading}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {product ? "Update Produk" : "Simpan Produk"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
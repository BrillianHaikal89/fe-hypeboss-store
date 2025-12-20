"use client";

import { useState, useEffect } from "react";
import { X, Upload, Loader2, AlertCircle } from "lucide-react";

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
}

export default function ProductModal({ isOpen, onClose, product, onSave }: ProductModalProps) {
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

  // Format angka dengan pemisah ribuan (format Indonesia)
  const formatWithThousandSeparator = (value: string): string => {
    if (!value) return "";
    
    // Hapus semua karakter non-numerik kecuali koma untuk desimal
    let cleanValue = value.replace(/[^\d,]/g, '');
    
    // Jika ada lebih dari satu koma, hanya ambil yang pertama
    const commaCount = (cleanValue.match(/,/g) || []).length;
    if (commaCount > 1) {
      const parts = cleanValue.split(',');
      cleanValue = parts[0] + ',' + parts.slice(1).join('');
    }
    
    // Pisahkan bagian integer dan desimal
    const [integerPart, decimalPart] = cleanValue.split(',');
    
    // Hapus leading zeros dari bagian integer
    let formattedInteger = integerPart.replace(/^0+/, '') || '0';
    
    // Tambahkan pemisah ribuan (titik) setiap 3 digit dari kanan
    formattedInteger = formattedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    // Gabungkan kembali dengan bagian desimal jika ada
    if (decimalPart !== undefined) {
      return `${formattedInteger},${decimalPart}`;
    }
    
    return formattedInteger;
  };

  // Parse angka yang diformat menjadi angka murni
  const parseFormattedNumber = (formattedValue: string): string => {
    if (!formattedValue) return "0";
    
    // Hapus semua titik (pemisah ribuan) dan ganti koma dengan titik untuk desimal
    return formattedValue.replace(/\./g, '').replace(',', '.');
  };

  // Handle price input change
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'price' | 'discount_price') => {
    let value = e.target.value;
    
    // Jika input kosong, set ke string kosong
    if (value === "") {
      setFormData(prev => ({
        ...prev,
        [fieldName]: ""
      }));
      return;
    }
    
    // Hapus semua karakter non-numerik kecuali koma
    let cleanValue = value.replace(/[^\d,]/g, '');
    
    // Jika ada lebih dari satu koma, hanya ambil yang pertama
    const commaCount = (cleanValue.match(/,/g) || []).length;
    if (commaCount > 1) {
      const parts = cleanValue.split(',');
      cleanValue = parts[0] + ',' + parts.slice(1).join('');
    }
    
    // Format dengan pemisah ribuan
    const formattedValue = formatWithThousandSeparator(cleanValue);
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: formattedValue
    }));
  };

  // Handle onBlur untuk membersihkan input
  const handlePriceBlur = (fieldName: 'price' | 'discount_price') => {
    const value = formData[fieldName];
    if (!value || value === "0") {
      setFormData(prev => ({
        ...prev,
        [fieldName]: ""
      }));
      return;
    }
    
    // Jika hanya ada "0," atau "0.", hapus
    if (value === "0," || value === "0.") {
      setFormData(prev => ({
        ...prev,
        [fieldName]: ""
      }));
      return;
    }
    
    // Format ulang untuk memastikan format yang benar
    const cleanValue = value.replace(/[^\d,]/g, '');
    const formattedValue = formatWithThousandSeparator(cleanValue);
    
    if (formattedValue !== value) {
      setFormData(prev => ({
        ...prev,
        [fieldName]: formattedValue
      }));
    }
  };

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        const data = await response.json();
        
        if (data.success) {
          setCategories(data.data || []);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Initialize form data when product changes
  useEffect(() => {
    if (product) {
      // Format prices for display (format Indonesia)
      const formatPriceForDisplay = (price: string) => {
        if (!price || price === "0" || price === "0.00") return "";
        const num = parseFloat(price);
        if (isNaN(num)) return "";
        
        // Format dengan Intl.NumberFormat untuk konsistensi
        const formatted = new Intl.NumberFormat('id-ID', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }).format(num);
        
        return formatted;
      };

      setFormData({
        name: product.name || "",
        description: product.description || "",
        category_id: product.category_id || 0,
        price: formatPriceForDisplay(product.price),
        discount_price: product.discount_price ? formatPriceForDisplay(product.discount_price) : "",
        stock: product.stock || 0,
        image: product.image || "",
        is_featured: product.is_featured || false,
        is_active: product.is_active !== undefined ? product.is_active : true,
      });
      setImagePreview(product.image || "");
    } else {
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
      setImagePreview("");
    }
    setImageFile(null);
    setError(null);
  }, [product, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else if (type === "number" && name === "stock") {
      // Only handle stock as number input
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else if (name !== "price" && name !== "discount_price") {
      // Handle other text inputs (not price fields)
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validasi ukuran file (maksimal 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Ukuran gambar maksimal 5MB");
        return;
      }
      
      // Validasi tipe file
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError("Format gambar harus JPG, PNG, atau GIF");
        return;
      }
      
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setError("Nama produk wajib diisi");
      return;
    }
    
    if (!formData.category_id) {
      setError("Kategori wajib dipilih");
      return;
    }
    
    // Parse price from formatted string
    const rawPrice = parseFormattedNumber(formData.price);
    const priceValue = parseFloat(rawPrice);
    
    if (!formData.price || priceValue <= 0 || isNaN(priceValue)) {
      setError("Harga harus lebih dari 0");
      return;
    }
    
    if (formData.stock < 0) {
      setError("Stok tidak boleh negatif");
      return;
    }
    
    // Validasi harga diskon
    if (formData.discount_price) {
      const rawDiscountPrice = parseFormattedNumber(formData.discount_price);
      const discountValue = parseFloat(rawDiscountPrice);
      
      if (discountValue >= priceValue) {
        setError("Harga diskon harus lebih kecil dari harga normal");
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("category_id", formData.category_id.toString());
      formDataToSend.append("price", parseFormattedNumber(formData.price));
      formDataToSend.append("discount_price", formData.discount_price ? parseFormattedNumber(formData.discount_price) : "0");
      formDataToSend.append("stock", formData.stock.toString());
      formDataToSend.append("is_featured", formData.is_featured.toString());
      formDataToSend.append("is_active", formData.is_active.toString());
      
      if (imageFile) {
        formDataToSend.append("image", imageFile);
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
      } else {
        throw new Error(data.message || "Terjadi kesalahan");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan produk");
      console.error("Error saving product:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay dengan opacity lebih rendah */}
      <div 
        className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {product ? "Edit Produk" : "Tambah Produk Baru"}
              </h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-900" />
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

              <div className="space-y-6">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Nama Produk <span className="text-red-700">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 font-medium"
                    placeholder="Masukkan nama produk"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-gray-900 font-medium"
                    placeholder="Masukkan deskripsi produk"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Kategori <span className="text-red-700">*</span>
                    </label>
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900 font-medium"
                      required
                    >
                      <option value="0">Pilih Kategori</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id} className="text-gray-900">
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Stock */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Stok <span className="text-red-700">*</span>
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Price */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Harga <span className="text-red-700">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium">
                        Rp
                      </span>
                      <input
                        type="text"
                        name="price"
                        value={formData.price}
                        onChange={(e) => handlePriceChange(e, 'price')}
                        onBlur={() => handlePriceBlur('price')}
                        className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 font-medium"
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>

                  {/* Discount Price */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Harga Diskon (opsional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium">
                        Rp
                      </span>
                      <input
                        type="text"
                        name="discount_price"
                        value={formData.discount_price}
                        onChange={(e) => handlePriceChange(e, 'discount_price')}
                        onBlur={() => handlePriceBlur('discount_price')}
                        className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 font-medium"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Gambar Produk
                  </label>
                  <div className="space-y-4">
                    {imagePreview && (
                      <div className="relative w-40 h-40 border border-gray-300 rounded-lg overflow-hidden">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center justify-center px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-500 transition-colors">
                        <Upload className="w-5 h-5 text-gray-700 mr-2" />
                        <span className="text-sm text-gray-900 font-medium">Upload Gambar</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                      {imageFile && (
                        <span className="text-sm text-gray-900 font-medium">
                          {imageFile.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-700 font-medium">
                      Ukuran maksimal: 5MB. Format: JPG, PNG, GIF
                    </p>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="is_featured"
                      checked={formData.is_featured}
                      onChange={handleChange}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-900 font-medium">Tandai sebagai produk unggulan</span>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-900 font-medium">Aktifkan produk</span>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-3">
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
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
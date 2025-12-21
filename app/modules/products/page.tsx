"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Package,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Star,
  RefreshCw,
  X,
  CheckCircle,
  XCircle,
  Info,
  ArrowLeft // <-- Tambahkan ini
} from "lucide-react";
import { useAuthStore } from "../../store/auth-store";
import ProductModal from "./components/productModal";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";

interface Product {
  id: number;
  name: string;
  description: string;
  category_id: number;
  category_name: string;
  price: string;
  discount_price: string;
  stock: number;
  image: string;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
}

interface PaginationData {
  current_page: number;
  total_pages: number;
  total_items: number;
  has_next: boolean;
  has_prev: boolean;
}

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

export default function ProductsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [deleteAction, setDeleteAction] = useState<"soft" | "hard">("soft");
  
  // Search & filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("active");
  
  // Pagination states
  const [pagination, setPagination] = useState<PaginationData>({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    has_next: false,
    has_prev: false,
  });

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Refs untuk debounce
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // BASE URL untuk API
  const API_BASE_URL = "http://localhost:3001/api";

  // Fungsi untuk menampilkan notifikasi
  const showNotification = (message: string, type: NotificationType = 'success') => {
    const id = Date.now().toString();
    const newNotification: Notification = { id, message, type };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Hapus notifikasi setelah 5 detik
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  // Fungsi untuk menghapus notifikasi
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Fungsi untuk mendapatkan ikon notifikasi
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  // Fungsi untuk mendapatkan warna notifikasi
  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-green-50 border-green-200 text-green-800';
    }
  };

  // Fetch products berdasarkan filter
  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      
      let endpoint = `${API_BASE_URL}/products`;
      let useIncludeInactive = false;
      
      if (filterStatus === "inactive") {
        endpoint = `${API_BASE_URL}/products/inactive`;
      } else if (filterStatus === "all") {
        useIncludeInactive = true;
      }
      
      if (useIncludeInactive) {
        params.append("includeInactive", "true");
      }
      
      const url = `${endpoint}?${params.toString()}`;
      console.log("Fetching products from:", url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data || []);
        
        if (data.pagination) {
          setPagination({
            current_page: data.pagination.current_page || 1,
            total_pages: data.pagination.total_pages || 1,
            total_items: data.pagination.total_items || 0,
            has_next: data.pagination.has_next || false,
            has_prev: data.pagination.has_prev || false,
          });
        } else {
          setPagination({
            current_page: 1,
            total_pages: 1,
            total_items: data.data?.length || 0,
            has_next: false,
            has_prev: false,
          });
        }
      } else {
        throw new Error(data.message || "Failed to fetch products");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      showNotification("Gagal memuat produk", 'error');
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    
    if (user) {
      const timer = setTimeout(() => {
        fetchProducts(1);
      }, isInitialLoad ? 0 : 300);
      
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, router, filterStatus, searchQuery]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(1);
  };

  // Handle filter change
  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.total_pages) {
      fetchProducts(page);
    }
  };

  // Handle add new product
  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  // Handle edit product
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // Handle toggle active status
  const handleToggleActive = async (productId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_active: !currentStatus
        }),
      });

      const data = await response.json();

      if (data.success) {
        showNotification(
          currentStatus ? "Produk berhasil dinonaktifkan" : "Produk berhasil diaktifkan",
          'success'
        );
        fetchProducts(pagination.current_page);
      } else {
        throw new Error(data.message || "Failed to update product status");
      }
    } catch (err) {
      console.error("Error updating product status:", err);
      showNotification("Gagal mengubah status produk", 'error');
    }
  };

  // Handle delete product
  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductToDelete(product.id);
    setDeleteAction(product.is_active ? "soft" : "hard");
    setIsDeleteModalOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      let url = `${API_BASE_URL}/products/${productToDelete}`;
      
      if (deleteAction === "hard") {
        url += "?deleteImage=true";
      }

      const response = await fetch(url, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        showNotification(
          deleteAction === "soft" 
            ? "Produk berhasil dinonaktifkan" 
            : "Produk berhasil dihapus permanen",
          'success'
        );
        fetchProducts(pagination.current_page);
        setIsDeleteModalOpen(false);
        setProductToDelete(null);
        setSelectedProduct(null);
      } else {
        throw new Error(data.message || "Failed to delete product");
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      showNotification("Gagal menghapus produk", 'error');
    }
  };

  // Handle restore product
  const handleRestoreProduct = async (productId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}/restore`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (data.success) {
        showNotification("Produk berhasil dipulihkan", 'success');
        fetchProducts(pagination.current_page);
      } else {
        throw new Error(data.message || "Failed to restore product");
      }
    } catch (err) {
      console.error("Error restoring product:", err);
      showNotification("Gagal memulihkan produk", 'error');
    }
  };

  // Handle product save (from modal)
  const handleProductSaved = () => {
    showNotification(
      selectedProduct ? "Produk berhasil diperbarui" : "Produk berhasil ditambahkan",
      'success'
    );
    fetchProducts(pagination.current_page);
    setIsModalOpen(false);
  };

  // Format currency
  const formatCurrency = (amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-800 font-medium">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notifications Container */}
      <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start p-4 rounded-lg border shadow-lg transform transition-all duration-300 animate-slide-in ${getNotificationColor(notification.type)}`}
          >
            <div className="flex-shrink-0 mr-3 mt-0.5">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-grow">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 ml-3 text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <main className="pt-16 md:pt-20">
        <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
              <div className="flex items-center w-full md:w-auto">
                {/* Tombol Kembali untuk Mobile */}
                <button
                  onClick={() => router.back()}
                  className="md:hidden flex items-center justify-center mr-3 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
                  title="Kembali"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Manajemen Produk</h1>
                  <p className="text-gray-700 mt-1 font-medium">Kelola produk Anda di sini</p>
                </div>
              </div>
              <button
                onClick={handleAddProduct}
                className="flex items-center justify-center space-x-2 px-4 md:px-6 py-2.5 md:py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all duration-200 hover:shadow-md w-full md:w-auto"
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-sm md:text-base font-semibold">Tambah Produk Baru</span>
              </button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
              {/* Search Input */}
              <div className="flex-1">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Cari produk..."
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    className="w-full pl-10 pr-24 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 font-medium"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Cari
                  </button>
                </form>
              </div>

              {/* Filter Buttons */}
              <div className="flex items-center space-x-2">
                <span className="text-gray-900 text-sm font-semibold flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter Status:
                </span>
                {["active", "inactive", "all"].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleFilterChange(status)}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      filterStatus === status
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    }`}
                  >
                    {status === "all" && "Semua"}
                    {status === "active" && "Aktif"}
                    {status === "inactive" && "Tidak Aktif"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                  <span className="ml-2 text-gray-900 font-medium">Memuat produk...</span>
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Package className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900">Tidak ada produk</h3>
                  <p className="text-gray-700 mt-1 font-medium">
                    {filterStatus === "active" ? "Tidak ada produk aktif" : 
                     filterStatus === "inactive" ? "Tidak ada produk tidak aktif" : 
                     "Tambahkan produk pertama Anda"}
                  </p>
                  <button
                    onClick={handleAddProduct}
                    className="mt-4 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Produk
                  </button>
                </div>
              ) : (
                <>
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-4 font-bold text-gray-900 text-sm min-w-[200px]">Produk</th>
                        <th className="text-left p-4 font-bold text-gray-900 text-sm min-w-[100px]">Kategori</th>
                        <th className="text-left p-4 font-bold text-gray-900 text-sm min-w-[120px]">Harga</th>
                        <th className="text-left p-4 font-bold text-gray-900 text-sm min-w-[80px]">Stok</th>
                        <th className="text-left p-4 font-bold text-gray-900 text-sm min-w-[120px]">Status</th>
                        <th className="text-left p-4 font-bold text-gray-900 text-sm min-w-[120px]">Ditambahkan</th>
                        <th className="text-left p-4 font-bold text-gray-900 text-sm min-w-[180px]">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {products.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/%3E%3Cpolyline points='9 22 9 12 15 12 15 22'/%3E%3C/svg%3E";
                                    }}
                                  />
                                ) : (
                                  <Package className="w-6 h-6 text-gray-600 m-auto" />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-sm">{product.name}</p>
                                <p className="text-gray-700 text-xs mt-1 line-clamp-1 font-medium">
                                  {product.description}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900">
                              {product.category_name || "Uncategorized"}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="font-bold text-gray-900 text-sm">
                                {formatCurrency(product.price)}
                              </div>
                              {product.discount_price && parseFloat(product.discount_price) > 0 && (
                                <div className="text-xs text-green-700 font-bold">
                                  Diskon: {formatCurrency(product.discount_price)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className={`font-bold text-sm ${
                              product.stock <= 5 ? 'text-red-700' : 
                              product.stock <= 20 ? 'text-yellow-700' : 
                              'text-gray-900'
                            }`}>
                              {product.stock} unit
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-2">
                              {product.is_featured && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-purple-100 text-purple-900">
                                  <Star className="w-3 h-3 mr-1" />
                                  Unggulan
                                </span>
                              )}
                              <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold ${
                                product.is_active 
                                  ? 'bg-green-100 text-green-900'
                                  : 'bg-red-100 text-red-900'
                              }`}>
                                {product.is_active ? 'Aktif' : 'Tidak Aktif'}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-gray-900 text-sm font-medium">
                              {formatDate(product.created_at)}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-700"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => handleToggleActive(product.id, product.is_active)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-900"
                                title={product.is_active ? "Nonaktifkan" : "Aktifkan"}
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => handleDeleteProduct(product)}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-700"
                                title={product.is_active ? "Nonaktifkan (Soft Delete)" : "Hapus Permanen"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              
                              {!product.is_active && (
                                <button
                                  onClick={() => handleRestoreProduct(product.id)}
                                  className="p-2 hover:bg-green-50 rounded-lg transition-colors text-green-700 font-semibold text-xs"
                                  title="Aktifkan Kembali"
                                >
                                  Restore
                                </button>
                              )}
                              
                              <button
                                onClick={() => router.push(`/modules/products/${product.id}`)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-900"
                                title="Lihat Detail"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  {pagination.total_pages > 1 && (
                    <div className="px-4 py-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-900 font-medium">
                          Menampilkan {products.length} dari {pagination.total_items} produk
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handlePageChange(pagination.current_page - 1)}
                            disabled={!pagination.has_prev}
                            className={`p-2 rounded-lg transition-colors ${
                              pagination.has_prev
                                ? 'hover:bg-gray-100 text-gray-900'
                                : 'text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                              let pageNum;
                              if (pagination.total_pages <= 5) {
                                pageNum = i + 1;
                              } else if (pagination.current_page <= 3) {
                                pageNum = i + 1;
                              } else if (pagination.current_page >= pagination.total_pages - 2) {
                                pageNum = pagination.total_pages - 4 + i;
                              } else {
                                pageNum = pagination.current_page - 2 + i;
                              }
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => handlePageChange(pageNum)}
                                  className={`w-8 h-8 rounded-lg transition-colors font-semibold ${
                                    pagination.current_page === pageNum
                                      ? 'bg-green-600 text-white'
                                      : 'hover:bg-gray-100 text-gray-900'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>
                          
                          <button
                            onClick={() => handlePageChange(pagination.current_page + 1)}
                            disabled={!pagination.has_next}
                            className={`p-2 rounded-lg transition-colors ${
                              pagination.has_next
                                ? 'hover:bg-gray-100 text-gray-900'
                                : 'text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        onSave={handleProductSaved}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setProductToDelete(null);
          setSelectedProduct(null);
        }}
        onConfirm={confirmDelete}
        title={selectedProduct?.is_active ? "Nonaktifkan Produk" : "Hapus Produk Permanen"}
        message={
          selectedProduct?.is_active 
            ? "Apakah Anda yakin ingin menonaktifkan produk ini? Produk akan disembunyikan dari pelanggan."
            : "PERINGATAN: Produk akan dihapus permanen termasuk gambar yang terkait. Tindakan ini tidak dapat dibatalkan!"
        }
      />

      {/* Tambahkan animasi CSS untuk notifikasi */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
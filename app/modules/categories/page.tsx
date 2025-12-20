"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  ChevronLeft,
  Upload,
  X,
  Search,
  Filter,
  Loader2,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";
import { useAuthStore } from "../../store/auth-store";

interface Category {
  id: number;
  name: string;
  description: string;
  image: string;
  is_active: boolean;
  created_at: string;
}

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

export default function CategoriesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'active' | 'inactive'>('active');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: null as File | null,
    is_active: "true"
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

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
        return <AlertCircle className="w-5 h-5" />;
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

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user, filterType]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      let url = "http://localhost:3001/api/categories";
      
      // Tentukan endpoint berdasarkan filter
      switch (filterType) {
        case 'all':
          url = "http://localhost:3001/api/categories?showInactive=true";
          break;
        case 'inactive':
          url = "http://localhost:3001/api/categories?status=false";
          break;
        case 'active':
        default:
          url = "http://localhost:3001/api/categories?status=true";
          break;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data || []);
      } else {
        throw new Error(data.message || "Gagal memuat kategori");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      showNotification("Gagal memuat kategori", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      image: null,
      is_active: "true"
    });
    setPreviewImage(null);
    setEditingCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showNotification("Nama kategori wajib diisi", 'error');
      return;
    }

    try {
      setFormLoading(true);
      
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("is_active", formData.is_active);
      
      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      const url = editingCategory 
        ? `http://localhost:3001/api/categories/${editingCategory.id}`
        : "http://localhost:3001/api/categories";
      
      const method = editingCategory ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        showNotification(
          editingCategory ? "Kategori berhasil diperbarui" : "Kategori berhasil ditambahkan",
          'success'
        );
        setShowModal(false);
        resetForm();
        fetchCategories();
      } else {
        throw new Error(data.message || "Terjadi kesalahan");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      showNotification("Gagal menyimpan kategori", 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (category: Category) => {
    try {
      // Fetch detail kategori termasuk yang nonaktif
      const response = await fetch(`http://localhost:3001/api/categories/${category.id}?showInactive=true`);
      const data = await response.json();
      
      if (data.success) {
        const categoryDetail = data.data;
        setEditingCategory(categoryDetail);
        setFormData({
          name: categoryDetail.name,
          description: categoryDetail.description,
          image: null,
          is_active: categoryDetail.is_active ? "true" : "false"
        });
        setPreviewImage(categoryDetail.image);
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error fetching category details:", error);
      showNotification("Gagal memuat detail kategori", 'error');
    }
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      const response = await fetch(`http://localhost:3001/api/categories/${categoryToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        showNotification("Kategori berhasil dihapus secara permanen", 'success');
        setShowDeleteModal(false);
        setCategoryToDelete(null);
        fetchCategories();
      } else {
        throw new Error(data.message || "Gagal menghapus kategori");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      showNotification("Gagal menghapus kategori", 'error');
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      const formData = new FormData();
      formData.append("name", category.name);
      formData.append("description", category.description);
      formData.append("is_active", (!category.is_active).toString());

      const response = await fetch(`http://localhost:3001/api/categories/${category.id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        showNotification(
          category.is_active 
            ? "Kategori berhasil dinonaktifkan" 
            : "Kategori berhasil diaktifkan",
          'success'
        );
        fetchCategories();
      } else {
        throw new Error(data.message || "Gagal mengubah status");
      }
    } catch (error) {
      console.error("Error toggling active status:", error);
      showNotification("Gagal mengubah status kategori", 'error');
    }
  };

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusBadge = (category: Category) => {
    if (category.is_active) {
      return {
        text: 'Aktif',
        className: 'bg-green-100 text-green-800 border border-green-200',
        icon: <Eye className="w-3 h-3" />
      };
    } else {
      return {
        text: 'Nonaktif',
        className: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        icon: <EyeOff className="w-3 h-3" />
      };
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-900 font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
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

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-700 hover:text-gray-900 mb-4 font-medium"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Kembali
          </button>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Manajemen Kategori</h1>
              <p className="text-gray-800 mt-1 font-medium">
                {filterType === 'active' && 'Hanya kategori aktif'}
                {filterType === 'inactive' && 'Hanya kategori nonaktif'}
                {filterType === 'all' && 'Semua kategori (aktif & nonaktif)'}
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors w-full md:w-auto shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Tambah Kategori</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType('active')}
              className={`px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center ${filterType === 'active' ? 'bg-green-600 text-white' : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'}`}
            >
              <Eye className="w-4 h-4 mr-1.5" />
              Aktif
            </button>
            <button
              onClick={() => setFilterType('inactive')}
              className={`px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center ${filterType === 'inactive' ? 'bg-yellow-600 text-white' : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'}`}
            >
              <EyeOff className="w-4 h-4 mr-1.5" />
              Nonaktif
            </button>
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2.5 rounded-lg font-medium ${filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'}`}
            >
              Semua
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari kategori..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-600 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => {
            const statusBadge = getStatusBadge(category);
            
            return (
              <div key={category.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                {/* Image */}
                <div className="h-48 overflow-hidden bg-gray-100">
                  {category.image ? (
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-50">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                          <EyeOff className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600">Tidak ada gambar</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-900">{category.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusBadge.className}`}>
                        {statusBadge.icon}
                        {statusBadge.text}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-800 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {category.description || "Tidak ada deskripsi"}
                  </p>
                  
                  <div className="text-xs text-gray-700 mb-4 font-medium">
                    <span className="text-gray-600">Dibuat:</span> {new Date(category.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleEdit(category)}
                      className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="text-sm">Edit</span>
                    </button>
                    <button
                      onClick={() => handleToggleActive(category)}
                      className="flex items-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors font-medium"
                    >
                      {category.is_active ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          <span className="text-sm">Nonaktifkan</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          <span className="text-sm">Aktifkan</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteClick(category)}
                      className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm">Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="text-gray-400 mb-4">
              <Filter className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada kategori ditemukan</h3>
            <p className="text-gray-700">
              {filterType === 'active' && 'Tidak ada kategori aktif'}
              {filterType === 'inactive' && 'Tidak ada kategori nonaktif'}
              {filterType === 'all' && 'Tidak ada kategori'}
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 text-green-600 hover:text-green-700 font-medium"
            >
              Reset pencarian
            </button>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50">
            {/* Overlay dengan opacity lebih rendah */}
            <div 
              className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            />
            
            {/* Modal Container */}
            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all duration-300">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-gray-900">
                        {editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
                      </h2>
                      <button
                        onClick={() => {
                          setShowModal(false);
                          resetForm();
                        }}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                      {/* Image Upload */}
                      <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Gambar Kategori
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 transition-colors bg-gray-50">
                          {previewImage ? (
                            <div className="relative">
                              <img 
                                src={previewImage} 
                                alt="Preview" 
                                className="w-full h-48 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewImage(null);
                                  setFormData(prev => ({ ...prev, image: null }));
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

                      {/* Name */}
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Nama Kategori *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                          placeholder="Masukkan nama kategori"
                          required
                        />
                      </div>

                      {/* Description */}
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Deskripsi
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                          placeholder="Masukkan deskripsi kategori (opsional)"
                        />
                      </div>

                      {/* Status */}
                      <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Status
                        </label>
                        <select
                          name="is_active"
                          value={formData.is_active}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
                        >
                          <option value="true">Aktif</option>
                          <option value="false">Nonaktif</option>
                        </select>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => {
                            setShowModal(false);
                            resetForm();
                          }}
                          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={formLoading}
                          className="flex-1 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                          {formLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                              Menyimpan...
                            </>
                          ) : (
                            editingCategory ? "Perbarui Kategori" : "Simpan Kategori"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && categoryToDelete && (
          <div className="fixed inset-0 z-50">
            {/* Overlay dengan opacity lebih rendah */}
            <div 
              className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => {
                setShowDeleteModal(false);
                setCategoryToDelete(null);
              }}
            />
            
            {/* Modal Container */}
            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300">
                  <div className="p-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-8 h-8 text-red-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        Hapus Kategori Permanen?
                      </h3>
                      <p className="text-gray-800 mb-6 leading-relaxed">
                        Apakah Anda yakin ingin menghapus kategori{" "}
                        <strong className="text-gray-900 font-semibold">"{categoryToDelete.name}"</strong> secara permanen? 
                        <br />
                        <span className="text-sm text-red-600 mt-1 block font-semibold">
                          PERINGATAN: Tindakan ini tidak dapat dibatalkan!
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setShowDeleteModal(false);
                          setCategoryToDelete(null);
                        }}
                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleDelete}
                        className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                      >
                        Ya, Hapus Permanen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
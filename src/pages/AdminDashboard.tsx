import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { LogOut, Plus, Edit2, Trash2, Copy, QrCode, BarChart3, Settings, Store, Shield, ChevronRight, Star, Palette, Check } from 'lucide-react';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';

interface Shop {
  id: string;
  name: string;
  type: string;
  keywords: string[];
  reviewLink: string;
  ownerId: string;
  createdAt: any;
  theme?: string;
}

type Tab = 'shops' | 'analytics' | 'settings';

const THEME_OPTIONS = [
  { id: 'default', name: 'Default', desc: 'Standard gradient look', color: 'bg-gradient-to-r from-pink-400 to-purple-400' },
  { id: 'mint-neumorphism', name: '🌿 Mint Soft Neumorphism', desc: 'Calm, clean, premium + cute', color: 'bg-[#e0f2eb] border border-[#becece]' },
  { id: 'dreamy-glass', name: '☁️ Dreamy Glass Pastel', desc: 'Dreamy + aesthetic + soft cute', color: 'bg-gradient-to-br from-pink-200 to-teal-200' },
  { id: 'soft-glow', name: '✨ Soft Glow UI', desc: 'Modern + slightly futuristic', color: 'bg-slate-900 border border-pink-500/50' },
  { id: 'bubble-pastel', name: '🍬 Bubble Pastel UI', desc: 'Ultra cute + playful', color: 'bg-pink-100 border-2 border-pink-300' },
  { id: 'calm-minimal', name: '🌸 Calm Minimal Cute', desc: 'Simple + clean + elegant', color: 'bg-[#fdfbf7] border border-slate-200' },
];

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [totalScans, setTotalScans] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [selectedShopForTheme, setSelectedShopForTheme] = useState<Shop | null>(null);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('shops');

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [keywords, setKeywords] = useState('');
  const [reviewLink, setReviewLink] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Ensure user document exists
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', currentUser.uid)));
          if (userDoc.empty) {
            await setDoc(userDocRef, {
              email: currentUser.email,
              role: currentUser.email === 'mnjkairi1@gmail.com' ? 'admin' : 'owner',
              createdAt: serverTimestamp()
            });
          }
        } catch (error) {
          console.error("Error ensuring user doc:", error);
        }
        fetchShops(currentUser.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchShops = async (userId: string) => {
    try {
      const q = query(collection(db, 'shops'), where('ownerId', '==', userId));
      const querySnapshot = await getDocs(q);
      const fetchedShops: Shop[] = [];
      querySnapshot.forEach((doc) => {
        fetchedShops.push({ id: doc.id, ...doc.data() } as Shop);
      });
      setShops(fetchedShops);

      // Fetch analytics
      if (fetchedShops.length > 0) {
        const shopIds = fetchedShops.map(s => s.id);
        const logsQuery = query(collection(db, 'logs'), where('shopId', 'in', shopIds.slice(0, 10)));
        const logsSnapshot = await getDocs(logsQuery);
        
        setTotalScans(logsSnapshot.size);
        let reviewsCount = 0;
        logsSnapshot.forEach(doc => {
          if (doc.data().reviewGenerated) reviewsCount++;
        });
        setTotalReviews(reviewsCount);
      } else {
        setTotalScans(0);
        setTotalReviews(0);
      }

    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'shops');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      toast.error('Failed to log in');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k);

    try {
      if (editingShop) {
        const shopRef = doc(db, 'shops', editingShop.id);
        await updateDoc(shopRef, {
          name,
          type,
          keywords: keywordArray,
          reviewLink,
        });
        toast.success('Shop updated successfully');
      } else {
        await addDoc(collection(db, 'shops'), {
          name,
          type,
          keywords: keywordArray,
          reviewLink,
          ownerId: user.uid,
          createdAt: serverTimestamp(),
        });
        toast.success('Shop added successfully');
      }
      setShowAddModal(false);
      setEditingShop(null);
      resetForm();
      fetchShops(user.uid);
    } catch (error) {
      handleFirestoreError(error, editingShop ? OperationType.UPDATE : OperationType.CREATE, 'shops');
      toast.error('Failed to save shop');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this shop?')) return;
    try {
      await deleteDoc(doc(db, 'shops', id));
      toast.success('Shop deleted');
      fetchShops(user!.uid);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'shops');
      toast.error('Failed to delete shop');
    }
  };

  const resetForm = () => {
    setName('');
    setType('');
    setKeywords('');
    setReviewLink('');
  };

  const openEditModal = (shop: Shop) => {
    setEditingShop(shop);
    setName(shop.name);
    setType(shop.type);
    setKeywords(shop.keywords.join(', '));
    setReviewLink(shop.reviewLink);
    setShowAddModal(true);
  };

  const openThemeModal = (shop: Shop) => {
    setSelectedShopForTheme(shop);
    setShowThemeModal(true);
  };

  const handleThemeChange = async (themeId: string) => {
    if (!selectedShopForTheme) return;
    try {
      const shopRef = doc(db, 'shops', selectedShopForTheme.id);
      await updateDoc(shopRef, { theme: themeId });
      toast.success('Theme updated successfully!');
      setShowThemeModal(false);
      fetchShops(user!.uid);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'shops');
      toast.error('Failed to update theme');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-pink-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-blue-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

        <div className="max-w-md w-full bg-white/40 backdrop-blur-xl border border-white/50 p-10 rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] text-center space-y-8 relative z-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-pink-400 to-purple-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-pink-200 transform -rotate-6">
            <QrCode className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">SMART AI REVIEWS</h1>
            <p className="text-slate-600 mt-2 font-medium">Sign in to manage your shops and QR codes.</p>
          </div>
          <button
            onClick={handleLogin}
            className="w-full py-4 px-6 bg-white/80 hover:bg-white text-slate-800 rounded-2xl font-bold shadow-sm hover:shadow-md transition-all border border-white flex items-center justify-center gap-3 group"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'shops':
        return (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">My Shops</h1>
                <p className="text-slate-500 font-medium mt-1">Manage your locations and download QR codes.</p>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setEditingShop(null);
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-2xl font-bold hover:opacity-90 transition-opacity shadow-lg shadow-pink-200"
              >
                <Plus className="w-5 h-5" />
                Add Shop
              </button>
            </div>

            {shops.length === 0 ? (
              <div className="bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/50 p-12 text-center shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]">
                <div className="w-20 h-20 bg-gradient-to-tr from-pink-100 to-purple-100 text-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Store className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No shops yet</h3>
                <p className="text-slate-500 mb-8 font-medium">Add your first shop to generate a QR code and start collecting reviews.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-colors shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  Add Shop
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {shops.map((shop) => {
                  const shopUrl = `${window.location.origin}/shop/${shop.id}`;
                  return (
                    <div key={shop.id} className="bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/50 p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] flex flex-col sm:flex-row gap-6 transition-all hover:bg-white/80 relative">
                      <div className="flex-1 space-y-4">
                        <div className="pr-24">
                          <h3 className="text-xl font-bold text-slate-800">{shop.name}</h3>
                          <span className="inline-block px-3 py-1 bg-pink-100 text-pink-700 text-xs font-bold rounded-lg mt-2">
                            {shop.type}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => openThemeModal(shop)}
                          className="absolute top-6 right-6 p-2.5 text-purple-600 bg-purple-100 hover:bg-purple-200 rounded-xl transition-colors shadow-sm flex items-center gap-2 font-bold text-sm"
                          title="Change Theme"
                        >
                          <Palette className="w-4 h-4" />
                          <span className="hidden sm:inline">Theme</span>
                        </button>

                        <div>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Keywords</p>
                          <div className="flex flex-wrap gap-2">
                            {shop.keywords.map((kw, i) => (
                              <span key={i} className="px-3 py-1 bg-white/50 text-slate-600 text-xs font-medium rounded-lg border border-slate-100 shadow-sm">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-4">
                          <button
                            onClick={() => openEditModal(shop)}
                            className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors bg-white/50 shadow-sm"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(shop.id)}
                            className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors bg-white/50 shadow-sm"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/shop/${shop.id}`);
                              toast.success('Public link copied!');
                            }}
                            className="p-2.5 text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-colors bg-white/50 shadow-sm ml-auto"
                            title="Copy Link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <Link
                            to={`/shop/${shop.id}`}
                            target="_blank"
                            className="text-sm text-pink-500 hover:text-pink-600 hover:underline font-bold flex items-center gap-1"
                          >
                            View Public Page <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        );
      case 'analytics':
        return (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Analytics</h1>
              <p className="text-slate-500 font-medium mt-1">Overview of your shop's performance.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] border border-white/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-tr from-blue-400 to-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <Store className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Shops</p>
                    <h3 className="text-3xl font-black text-slate-800 mt-1">{shops.length}</h3>
                  </div>
                </div>
              </div>
              <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] border border-white/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-tr from-emerald-400 to-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                    <QrCode className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Scans</p>
                    <h3 className="text-3xl font-black text-slate-800 mt-1">{totalScans}</h3>
                  </div>
                </div>
              </div>
              <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] border border-white/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-tr from-amber-400 to-amber-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
                    <BarChart3 className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Reviews Generated</p>
                    <h3 className="text-3xl font-black text-slate-800 mt-1">{totalReviews}</h3>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      case 'settings':
        return (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Settings</h1>
              <p className="text-slate-500 font-medium mt-1">Manage your account and preferences.</p>
            </div>
            
            <div className="max-w-2xl space-y-6">
              <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/50 p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Account</h2>
                <div className="flex items-center gap-4 mb-8 p-4 bg-white/50 rounded-2xl border border-white">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
                    {user.email?.[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{user.email}</p>
                    <p className="text-sm text-slate-500 font-medium">Logged in via Google</p>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-bold transition-colors border border-red-100"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>

              <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/50 p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Legal</h2>
                <Link to="/privacy-policy" className="flex items-center justify-between p-4 bg-white/50 hover:bg-white/80 rounded-2xl border border-white transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      <Shield className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-700">Privacy Policy</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                </Link>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex flex-col md:flex-row font-sans relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-96 h-96 bg-pink-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 pointer-events-none"></div>
      <div className="fixed top-[20%] right-[-10%] w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 pointer-events-none"></div>
      <div className="fixed bottom-[-20%] left-[20%] w-96 h-96 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 pointer-events-none"></div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col bg-white/40 backdrop-blur-2xl border-r border-white/50 relative z-20">
        <div className="p-8">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 bg-gradient-to-tr from-pink-400 to-purple-500 rounded-xl flex items-center justify-center shadow-md transform -rotate-6">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            SMART AI<br/>REVIEWS
          </h2>
        </div>
        <nav className="flex-1 px-6 space-y-3">
          <button 
            onClick={() => setActiveTab('shops')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'shops' ? 'bg-white shadow-sm text-pink-600 border border-white' : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'}`}
          >
            <Store className="w-5 h-5" />
            My Shops
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'analytics' ? 'bg-white shadow-sm text-pink-600 border border-white' : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'}`}
          >
            <BarChart3 className="w-5 h-5" />
            Analytics
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'settings' ? 'bg-white shadow-sm text-pink-600 border border-white' : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'}`}
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </nav>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white/60 backdrop-blur-2xl border-b border-white/50 p-4 sticky top-0 z-30">
        <h2 className="text-xl font-black text-slate-800 flex items-center justify-center gap-2 tracking-tight">
          <div className="w-8 h-8 bg-gradient-to-tr from-pink-400 to-purple-500 rounded-lg flex items-center justify-center shadow-sm transform -rotate-6">
            <QrCode className="w-4 h-4 text-white" />
          </div>
          SMART AI REVIEWS
        </h2>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative z-10 pb-24 md:pb-10">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-white/50 p-4 pb-safe z-30 flex justify-around items-center shadow-[0_-8px_32px_0_rgba(31,38,135,0.05)]">
        <button 
          onClick={() => setActiveTab('shops')}
          className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'shops' ? 'text-pink-600' : 'text-slate-400'}`}
        >
          <Store className="w-6 h-6" />
          <span className="text-[10px] font-bold">Shops</span>
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'analytics' ? 'text-pink-600' : 'text-slate-400'}`}
        >
          <BarChart3 className="w-6 h-6" />
          <span className="text-[10px] font-bold">Analytics</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'settings' ? 'text-pink-600' : 'text-slate-400'}`}
        >
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-bold">Settings</span>
        </button>
      </nav>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-white">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/50">
              <h2 className="text-xl font-black text-slate-800">
                {editingShop ? 'Edit Shop' : 'Add New Shop'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Shop Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all font-medium"
                  placeholder="e.g. ABC Salon"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Type</label>
                <input
                  type="text"
                  required
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all font-medium"
                  placeholder="e.g. Salon, Restaurant, Clinic"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Keywords (comma separated)</label>
                <input
                  type="text"
                  required
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all font-medium"
                  placeholder="e.g. staff, cleanliness, haircut"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Google Review Link</label>
                <input
                  type="url"
                  required
                  value={reviewLink}
                  onChange={(e) => setReviewLink(e.target.value)}
                  className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all font-medium"
                  placeholder="https://g.page/r/..."
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-5 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-5 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-2xl font-bold hover:opacity-90 transition-opacity shadow-lg shadow-pink-200"
                >
                  {editingShop ? 'Save Changes' : 'Add Shop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Theme Selection Modal */}
      {showThemeModal && selectedShopForTheme && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/50">
              <div>
                <h2 className="text-xl font-black text-slate-800">Choose Theme</h2>
                <p className="text-sm text-slate-500 font-medium">Select a unique look for {selectedShopForTheme.name}</p>
              </div>
              <button
                onClick={() => setShowThemeModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-3">
                {THEME_OPTIONS.map((theme) => {
                  const isSelected = (selectedShopForTheme.theme || 'default') === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeChange(theme.id)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                        isSelected 
                          ? 'border-purple-500 bg-purple-50 shadow-md' 
                          : 'border-slate-100 bg-white hover:border-purple-200 hover:bg-purple-50/50'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full shadow-inner flex-shrink-0 ${theme.color}`}></div>
                      <div className="flex-1">
                        <h4 className={`font-bold ${isSelected ? 'text-purple-900' : 'text-slate-800'}`}>{theme.name}</h4>
                        <p className={`text-xs mt-0.5 ${isSelected ? 'text-purple-600' : 'text-slate-500'}`}>{theme.desc}</p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


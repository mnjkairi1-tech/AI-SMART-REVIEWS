import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { LogOut, Plus, Edit2, Trash2, Copy, QrCode, BarChart3, Settings, Store, Shield, ChevronRight, Star, Palette, Check } from 'lucide-react';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'motion/react';

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

type Tab = 'shops' | 'analytics' | 'settings' | 'superadmin';

const THEME_OPTIONS = [
  { id: 'mint-neumorphism', name: '🌿 Mint Soft Neumorphism', desc: 'Calm, clean, premium + cute', color: 'bg-[#e0f2eb] border border-[#becece]' },
  { id: 'default', name: 'Default', desc: 'Standard gradient look', color: 'bg-gradient-to-r from-pink-400 to-purple-400' },
  { id: 'dreamy-glass', name: '☁️ Dreamy Glass Pastel', desc: 'Dreamy + aesthetic + soft cute', color: 'bg-gradient-to-br from-[#e0f2eb] to-[#f0f4f8]' },
  { id: 'soft-glow', name: '✨ Soft Glow UI', desc: 'Modern + slightly futuristic', color: 'bg-[#f4fbf8] border border-teal-100' },
  { id: 'bubble-pastel', name: '🍬 Bubble Pastel UI', desc: 'Ultra cute + playful', color: 'bg-[#ebf7f3] border-2 border-[#d1efe3]' },
  { id: 'calm-minimal', name: '🌸 Calm Minimal Cute', desc: 'Simple + clean + elegant', color: 'bg-[#f9fcfb] border border-[#e2f0eb]' },
  { id: 'cyberpunk-neon', name: '🌌 Cyberpunk Neon', desc: 'Dark + bright neon colors', color: 'bg-gray-900 border border-cyan-400' },
  { id: 'sunset-gradient', name: '🌅 Sunset Gradient', desc: 'Warm orange, pink, yellow', color: 'bg-gradient-to-r from-orange-400 to-pink-500' },
  { id: 'ocean-breeze', name: '🌊 Ocean Breeze', desc: 'Cool blues and teals', color: 'bg-gradient-to-r from-cyan-200 to-blue-400' },
  { id: 'midnight-monolith', name: '🌑 Midnight Monolith', desc: 'Deep blacks and dark grays', color: 'bg-black border border-gray-800' },
];

const DASHBOARD_THEMES = {
  'default': {
    bg: 'bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50',
    sidebar: 'bg-white/40 backdrop-blur-2xl border-r border-white/50',
    card: 'bg-white/60 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]',
    text: 'text-slate-800',
    subtext: 'text-slate-500',
    primaryBtn: 'bg-slate-800 hover:bg-slate-700 text-white',
    navActive: 'bg-white/60 text-pink-600 shadow-sm border border-white/50',
    navInactive: 'text-slate-500 hover:bg-white/40 hover:text-slate-800',
    blobs: true
  },
  'mint-neumorphism': {
    bg: 'bg-[#e0f2eb]',
    sidebar: 'bg-[#e0f2eb] shadow-[9px_0_16px_#becece] border-none',
    card: 'bg-[#e0f2eb] rounded-[25px] shadow-[9px_9px_16px_#becece,-9px_-9px_16px_#ffffff] border-none',
    text: 'text-teal-800',
    subtext: 'text-teal-600/70',
    primaryBtn: 'bg-[#e0f2eb] text-teal-700 shadow-[5px_5px_10px_#becece,-5px_-5px_10px_#ffffff] hover:shadow-[inset_5px_5px_10px_#becece,inset_-5px_-5px_10px_#ffffff] rounded-2xl',
    navActive: 'text-teal-700 shadow-[inset_5px_5px_10px_#becece,inset_-5px_-5px_10px_#ffffff] bg-transparent border-none rounded-2xl',
    navInactive: 'text-teal-600/70 hover:text-teal-700 rounded-2xl',
    blobs: false
  },
  'dreamy-glass': {
    bg: 'bg-gradient-to-br from-[#e0f2eb] via-[#e0eaf5] to-[#f0f4f8]',
    sidebar: 'bg-white/30 backdrop-blur-xl border-r border-white/60',
    card: 'bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_0_rgba(180,200,210,0.3)] rounded-[25px]',
    text: 'text-slate-700',
    subtext: 'text-slate-500',
    primaryBtn: 'bg-white/50 hover:bg-white/70 text-teal-700 border border-white/60 shadow-sm rounded-2xl',
    navActive: 'text-teal-700 bg-white/60 border border-white/60 shadow-sm rounded-2xl',
    navInactive: 'text-slate-500 hover:bg-white/40 rounded-2xl',
    blobs: true
  },
  'soft-glow': {
    bg: 'bg-[#f4fbf8]',
    sidebar: 'bg-white border-r border-teal-100 shadow-[4px_0_24px_rgba(45,212,191,0.05)]',
    card: 'bg-white rounded-[25px] shadow-[0_0_20px_rgba(45,212,191,0.1)] border border-teal-50',
    text: 'text-teal-900',
    subtext: 'text-teal-600/80',
    primaryBtn: 'bg-teal-50 text-teal-600 border border-teal-200 shadow-[0_0_10px_rgba(45,212,191,0.2)] hover:shadow-[0_0_15px_rgba(45,212,191,0.4)] rounded-2xl transition-all',
    navActive: 'text-teal-600 bg-teal-50 border border-teal-100 shadow-[0_0_10px_rgba(45,212,191,0.15)] rounded-2xl',
    navInactive: 'text-teal-600/60 hover:text-teal-600 hover:bg-teal-50/50 rounded-2xl',
    blobs: false
  },
  'bubble-pastel': {
    bg: 'bg-[#ebf7f3]',
    sidebar: 'bg-[#e0f2eb] border-r-4 border-[#d1efe3]',
    card: 'bg-white rounded-[35px] border-4 border-[#d1efe3] shadow-none',
    text: 'text-teal-800',
    subtext: 'text-teal-500',
    primaryBtn: 'bg-gradient-to-r from-[#86e3ce] to-[#6ee7b7] text-teal-900 rounded-full shadow-[0_4px_0_#34d399] active:translate-y-[4px] active:shadow-none transition-all',
    navActive: 'text-teal-800 bg-[#d1efe3] border-2 border-[#86e3ce] rounded-full',
    navInactive: 'text-teal-600 hover:bg-[#d1efe3]/50 rounded-full',
    blobs: false
  },
  'calm-minimal': {
    bg: 'bg-[#f9fcfb]',
    sidebar: 'bg-white border-r border-[#e2f0eb]',
    card: 'bg-white rounded-[25px] border border-[#e2f0eb] shadow-sm',
    text: 'text-slate-700 font-light',
    subtext: 'text-slate-500 font-light',
    primaryBtn: 'bg-[#eef8f4] text-teal-700 hover:bg-[#e2f0eb] rounded-2xl font-light tracking-wide',
    navActive: 'text-teal-800 bg-[#eef8f4] rounded-2xl border-none',
    navInactive: 'text-slate-500 hover:bg-[#f4fbf8] rounded-2xl',
    blobs: false
  },
  'cyberpunk-neon': {
    bg: 'bg-gray-950',
    sidebar: 'bg-gray-900 border-r border-cyan-500/30',
    card: 'bg-gray-900/80 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)] rounded-xl',
    text: 'text-cyan-400',
    subtext: 'text-cyan-600',
    primaryBtn: 'bg-gray-900 text-cyan-400 border border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.6)] transition-all',
    navActive: 'text-cyan-400 bg-gray-900 border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]',
    navInactive: 'text-cyan-700 hover:text-cyan-400 hover:bg-gray-900/50',
    blobs: false
  },
  'sunset-gradient': {
    bg: 'bg-gradient-to-br from-orange-100 via-red-50 to-pink-100',
    sidebar: 'bg-white/40 backdrop-blur-md border-r border-orange-200/50',
    card: 'bg-white/60 backdrop-blur-xl border border-orange-200/50 shadow-lg rounded-[2rem]',
    text: 'text-orange-900',
    subtext: 'text-orange-700',
    primaryBtn: 'bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:opacity-90 shadow-md',
    navActive: 'text-orange-700 bg-orange-100/80 border border-orange-200',
    navInactive: 'text-orange-600/70 hover:bg-orange-50/50 hover:text-orange-800',
    blobs: true
  },
  'ocean-breeze': {
    bg: 'bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50',
    sidebar: 'bg-white/50 backdrop-blur-lg border-r border-cyan-100',
    card: 'bg-white/70 backdrop-blur-xl border border-cyan-100 shadow-xl rounded-[2rem]',
    text: 'text-cyan-900',
    subtext: 'text-cyan-700',
    primaryBtn: 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-md',
    navActive: 'text-cyan-700 bg-cyan-100/80 border border-cyan-200',
    navInactive: 'text-cyan-600/70 hover:bg-cyan-50 hover:text-cyan-800',
    blobs: true
  },
  'midnight-monolith': {
    bg: 'bg-black',
    sidebar: 'bg-[#0a0a0a] border-r border-gray-800',
    card: 'bg-[#111] border border-gray-800 rounded-2xl shadow-2xl',
    text: 'text-gray-100',
    subtext: 'text-gray-400',
    primaryBtn: 'bg-white text-black hover:bg-gray-200 rounded-lg',
    navActive: 'text-white bg-gray-900 border border-gray-800 rounded-lg',
    navInactive: 'text-gray-500 hover:text-gray-300 hover:bg-gray-900/50 rounded-lg',
    blobs: false
  }
};

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<any>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [totalScans, setTotalScans] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [selectedShopForTheme, setSelectedShopForTheme] = useState<Shop | null>(null);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('shops');
  
  // Super Admin State
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allShops, setAllShops] = useState<any[]>([]);
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [superAdminLoading, setSuperAdminLoading] = useState(false);
  const [superAdminFetched, setSuperAdminFetched] = useState(false);
  
  const [dashboardTheme, setDashboardTheme] = useState(() => {
    return localStorage.getItem('dashboardTheme') || 'mint-neumorphism';
  });

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
          const userDocSnap = await getDoc(userDocRef);
          if (!userDocSnap.exists()) {
            const newUser = {
              email: currentUser.email,
              role: currentUser.email === 'mnjkairi1@gmail.com' ? 'admin' : 'owner',
              createdAt: serverTimestamp(),
              isBlocked: false
            };
            await setDoc(userDocRef, newUser);
            setDbUser(newUser);
          } else {
            setDbUser(userDocSnap.data());
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

  const fetchSuperAdminData = async () => {
    if (user?.email !== 'mnjkairi1@gmail.com') return;
    setSuperAdminLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const shopsSnap = await getDocs(collection(db, 'shops'));
      const logsSnap = await getDocs(collection(db, 'logs'));
      
      const usersData: any[] = [];
      usersSnap.forEach(doc => usersData.push({ id: doc.id, ...doc.data() }));
      
      const shopsData: any[] = [];
      shopsSnap.forEach(doc => shopsData.push({ id: doc.id, ...doc.data() }));
      
      const logsData: any[] = [];
      logsSnap.forEach(doc => logsData.push({ id: doc.id, ...doc.data() }));
      
      setAllUsers(usersData);
      setAllShops(shopsData);
      setAllLogs(logsData);
      setSuperAdminFetched(true);
    } catch (error) {
      console.error("Failed to fetch super admin data", error);
      toast.error("Failed to load super admin dashboard.");
    } finally {
      setSuperAdminLoading(false);
    }
  };

  const toggleUserBlock = async (userId: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { isBlocked: !currentStatus });
      toast.success(`User ${!currentStatus ? 'blocked' : 'unblocked'} successfully`);
      setAllUsers(allUsers.map(u => u.id === userId ? { ...u, isBlocked: !currentStatus } : u));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
      toast.error('Failed to update user status');
    }
  };

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

  const currentTheme = DASHBOARD_THEMES[dashboardTheme as keyof typeof DASHBOARD_THEMES] || DASHBOARD_THEMES['mint-neumorphism'];

  const renderContent = () => {
    switch (activeTab) {
      case 'shops':
        return (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <div>
                <h1 className={`text-3xl font-black ${currentTheme.text} tracking-tight`}>My Shops</h1>
                <p className={`${currentTheme.subtext} font-medium mt-1`}>Manage your locations and download QR codes.</p>
              </div>
              <button
                onClick={() => {
                  if (dbUser?.isBlocked) {
                    toast.error('Your account is blocked.');
                    return;
                  }
                  resetForm();
                  setEditingShop(null);
                  setShowAddModal(true);
                }}
                disabled={dbUser?.isBlocked}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-sm hover:shadow-md ${currentTheme.primaryBtn} ${dbUser?.isBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Plus className="w-5 h-5" />
                Add Shop
              </button>
            </div>

            {dbUser?.isBlocked && (
              <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-4 rounded-2xl relative flex items-center gap-3 shadow-sm" role="alert">
                <Shield className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <strong className="font-bold block text-lg">Account Blocked</strong>
                  <span className="block sm:inline">Your account has been blocked by the administrator. You cannot add or edit shops. Please contact support for assistance.</span>
                </div>
              </div>
            )}

            {shops.length === 0 ? (
              <div className={`${currentTheme.card} p-12 text-center`}>
                <div className="w-20 h-20 bg-gradient-to-tr from-pink-100 to-purple-100 text-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Store className="w-10 h-10" />
                </div>
                <h3 className={`text-xl font-bold ${currentTheme.text} mb-2`}>No shops yet</h3>
                <p className={`${currentTheme.subtext} mb-8 font-medium`}>Add your first shop to generate a QR code and start collecting reviews.</p>
                <button
                  onClick={() => {
                    if (dbUser?.isBlocked) {
                      toast.error('Your account is blocked.');
                      return;
                    }
                    setShowAddModal(true);
                  }}
                  disabled={dbUser?.isBlocked}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-colors shadow-lg ${currentTheme.primaryBtn} ${dbUser?.isBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Plus className="w-5 h-5" />
                  Add Shop
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {shops.map((shop) => {
                  // Encode shop data for instant loading on the public page
                  const shopData = {
                    n: shop.name,
                    t: shop.type,
                    k: shop.keywords,
                    l: shop.reviewLink,
                    th: shop.theme || 'mint-neumorphism'
                  };
                  const encodedData = btoa(encodeURIComponent(JSON.stringify(shopData)));
                  const shopUrl = `${window.location.origin}/shop/${shop.id}?d=${encodedData}`;
                  const simpleShopUrl = `${window.location.origin}/shop/${shop.id}?mode=simple`;
                  
                  return (
                    <div key={shop.id} className={`${currentTheme.card} p-6 flex flex-col sm:flex-row gap-6 transition-all relative`}>
                      <div className="flex-1 space-y-4">
                        <div className="pr-24">
                          <h3 className={`text-xl font-bold ${currentTheme.text}`}>{shop.name}</h3>
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
                          <p className={`text-xs ${currentTheme.subtext} font-bold uppercase tracking-wider mb-2`}>Keywords</p>
                          <div className="flex flex-wrap gap-2">
                            {shop.keywords.map((kw, i) => (
                              <span key={i} className="px-3 py-1 bg-white/50 text-slate-600 text-xs font-medium rounded-lg border border-slate-100 shadow-sm">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-4 flex-wrap">
                          <button
                            onClick={() => {
                              if (dbUser?.isBlocked) {
                                toast.error('Your account is blocked.');
                                return;
                              }
                              openEditModal(shop);
                            }}
                            disabled={dbUser?.isBlocked}
                            className={`p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors bg-white/50 shadow-sm ${dbUser?.isBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                              navigator.clipboard.writeText(shopUrl);
                              toast.success('Smart AI QR link copied!');
                            }}
                            className="p-2.5 text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-colors bg-white/50 shadow-sm"
                            title="Copy Smart AI Link"
                          >
                            <Copy className="w-4 h-4" /> Smart AI
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(simpleShopUrl);
                              toast.success('Simple QR link copied!');
                            }}
                            className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors bg-white/50 shadow-sm"
                            title="Copy Simple Link"
                          >
                            <Copy className="w-4 h-4" /> Simple
                          </button>
                          <Link
                            to={`/shop/${shop.id}?d=${encodedData}`}
                            target="_blank"
                            className="text-sm text-pink-500 hover:text-pink-600 hover:underline font-bold flex items-center gap-1 ml-auto"
                          >
                            View Smart Page <ChevronRight className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/shop/${shop.id}?mode=simple`}
                            target="_blank"
                            className="text-sm text-blue-500 hover:text-blue-600 hover:underline font-bold flex items-center gap-1"
                          >
                            View Simple Page <ChevronRight className="w-4 h-4" />
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
              <h1 className={`text-3xl font-black ${currentTheme.text} tracking-tight`}>Analytics</h1>
              <p className={`${currentTheme.subtext} font-medium mt-1`}>Overview of your shop's performance.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className={`${currentTheme.card} p-8 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-tr from-blue-400 to-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <Store className="w-7 h-7" />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${currentTheme.subtext} uppercase tracking-wider`}>Total Shops</p>
                    <h3 className={`text-3xl font-black ${currentTheme.text} mt-1`}>{shops.length}</h3>
                  </div>
                </div>
              </div>
              <div className={`${currentTheme.card} p-8 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-tr from-emerald-400 to-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                    <QrCode className="w-7 h-7" />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${currentTheme.subtext} uppercase tracking-wider`}>Total Scans</p>
                    <h3 className={`text-3xl font-black ${currentTheme.text} mt-1`}>{totalScans}</h3>
                  </div>
                </div>
              </div>
              <div className={`${currentTheme.card} p-8 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-tr from-amber-400 to-amber-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
                    <BarChart3 className="w-7 h-7" />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${currentTheme.subtext} uppercase tracking-wider`}>Reviews Generated</p>
                    <h3 className={`text-3xl font-black ${currentTheme.text} mt-1`}>{totalReviews}</h3>
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
              <h1 className={`text-3xl font-black ${currentTheme.text} tracking-tight`}>Settings</h1>
              <p className={`${currentTheme.subtext} font-medium mt-1`}>Manage your account and preferences.</p>
            </div>
            
            <div className="max-w-2xl space-y-6">
              <div className={`${currentTheme.card} p-8`}>
                <h2 className={`text-xl font-bold ${currentTheme.text} mb-6`}>Dashboard Theme</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {THEME_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setDashboardTheme(option.id);
                        localStorage.setItem('dashboardTheme', option.id);
                      }}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${dashboardTheme === option.id ? 'border-pink-500 bg-pink-50/50' : 'border-transparent bg-white/50 hover:bg-white/80'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`font-bold ${currentTheme.text}`}>{option.name}</h3>
                        {dashboardTheme === option.id && <Check className="w-5 h-5 text-pink-500" />}
                      </div>
                      <p className={`text-xs ${currentTheme.subtext} font-medium`}>{option.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className={`${currentTheme.card} p-8`}>
                <h2 className={`text-xl font-bold ${currentTheme.text} mb-6`}>Account</h2>
                <div className="flex items-center gap-4 mb-8 p-4 bg-white/50 rounded-2xl border border-white">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
                    {user.email?.[0].toUpperCase()}
                  </div>
                  <div>
                    <p className={`font-bold ${currentTheme.text}`}>{user.email}</p>
                    <p className={`text-sm ${currentTheme.subtext} font-medium`}>Logged in via Google</p>
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

              <div className={`${currentTheme.card} p-8`}>
                <h2 className={`text-xl font-bold ${currentTheme.text} mb-6`}>Legal</h2>
                <Link to="/privacy-policy" className="flex items-center justify-between p-4 bg-white/50 hover:bg-white/80 rounded-2xl border border-white transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      <Shield className="w-5 h-5" />
                    </div>
                    <span className={`font-bold ${currentTheme.text}`}>Privacy Policy</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                </Link>
              </div>
            </div>
          </>
        );
      case 'superadmin':
        if (user?.email !== 'mnjkairi1@gmail.com') return null;
        return (
          <>
            <div className="mb-8">
              <h1 className={`text-3xl font-black ${currentTheme.text} tracking-tight`}>Super Admin</h1>
              <p className={`${currentTheme.subtext} font-medium mt-1`}>Platform overview and user management.</p>
            </div>
            
            {superAdminLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={`${currentTheme.card} p-8 flex items-center gap-6`}>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-400 to-indigo-500 flex items-center justify-center text-white shadow-lg transform -rotate-3">
                      <Store className="w-8 h-8" />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${currentTheme.subtext} uppercase tracking-wider`}>Total Shops</p>
                      <h3 className={`text-4xl font-black ${currentTheme.text} mt-1`}>{allShops.length}</h3>
                    </div>
                  </div>
                  <div className={`${currentTheme.card} p-8 flex items-center gap-6`}>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-lg transform rotate-3">
                      <Shield className="w-8 h-8" />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${currentTheme.subtext} uppercase tracking-wider`}>Total Owners</p>
                      <h3 className={`text-4xl font-black ${currentTheme.text} mt-1`}>{allUsers.length}</h3>
                    </div>
                  </div>
                  <div className={`${currentTheme.card} p-8 flex items-center gap-6`}>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg transform -rotate-3">
                      <QrCode className="w-8 h-8" />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${currentTheme.subtext} uppercase tracking-wider`}>Total QR Clicks</p>
                      <h3 className={`text-4xl font-black ${currentTheme.text} mt-1`}>{allLogs.length}</h3>
                    </div>
                  </div>
                </div>

                {/* Users List */}
                <div className={`${currentTheme.card} p-8`}>
                  <h2 className={`text-xl font-bold ${currentTheme.text} mb-6`}>Platform Users</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`border-b border-slate-200 ${currentTheme.subtext}`}>
                          <th className="pb-4 font-bold text-sm uppercase tracking-wider">Email</th>
                          <th className="pb-4 font-bold text-sm uppercase tracking-wider">Role</th>
                          <th className="pb-4 font-bold text-sm uppercase tracking-wider">Shops Owned</th>
                          <th className="pb-4 font-bold text-sm uppercase tracking-wider">QR Clicks</th>
                          <th className="pb-4 font-bold text-sm uppercase tracking-wider">Joined</th>
                          <th className="pb-4 font-bold text-sm uppercase tracking-wider">Status</th>
                          <th className="pb-4 font-bold text-sm uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allUsers.map(u => {
                          const userShops = allShops.filter(s => s.ownerId === u.id);
                          const userShopIds = userShops.map(s => s.id);
                          const userLogs = allLogs.filter(l => userShopIds.includes(l.shopId));
                          return (
                            <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                              <td className={`py-4 font-bold ${currentTheme.text}`}>{u.email}</td>
                              <td className="py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className={`py-4 font-bold ${currentTheme.text}`}>{userShops.length}</td>
                              <td className={`py-4 font-bold ${currentTheme.text}`}>{userLogs.length}</td>
                              <td className={`py-4 text-sm ${currentTheme.subtext}`}>
                                {u.createdAt?.toDate ? new Date(u.createdAt.toDate()).toLocaleDateString() : 'Unknown'}
                              </td>
                              <td className="py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                  {u.isBlocked ? 'Blocked' : 'Active'}
                                </span>
                              </td>
                              <td className="py-4">
                                {u.email !== 'mnjkairi1@gmail.com' && (
                                  <button
                                    onClick={() => toggleUserBlock(u.id, u.isBlocked)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${u.isBlocked ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                  >
                                    {u.isBlocked ? 'Unblock' : 'Block'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {allUsers.length === 0 && (
                          <tr>
                            <td colSpan={5} className={`py-8 text-center ${currentTheme.subtext} font-medium`}>
                              No users found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        );
    }
  };

  return (
    <div className={`min-h-screen ${currentTheme.bg} flex flex-col md:flex-row font-sans relative overflow-hidden transition-colors duration-500`}>
      {/* Decorative background blobs */}
      {currentTheme.blobs && (
        <>
          <div className="fixed top-[-10%] left-[-10%] w-96 h-96 bg-pink-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 pointer-events-none"></div>
          <div className="fixed top-[20%] right-[-10%] w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 pointer-events-none"></div>
          <div className="fixed bottom-[-20%] left-[20%] w-96 h-96 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 pointer-events-none"></div>
        </>
      )}

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex w-72 flex-col ${currentTheme.sidebar} relative z-20 transition-colors duration-500`}>
        <div className="p-8">
          <h2 className={`text-2xl font-black ${currentTheme.text} flex items-center gap-3 tracking-tight`}>
            <div className="w-10 h-10 bg-gradient-to-tr from-pink-400 to-purple-500 rounded-xl flex items-center justify-center shadow-md transform -rotate-6">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            SMART AI<br/>REVIEWS
          </h2>
        </div>
        <nav className="flex-1 px-6 space-y-3">
          <button 
            onClick={() => setActiveTab('shops')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'shops' ? currentTheme.navActive : currentTheme.navInactive}`}
          >
            <Store className="w-5 h-5" />
            My Shops
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'analytics' ? currentTheme.navActive : currentTheme.navInactive}`}
          >
            <BarChart3 className="w-5 h-5" />
            Analytics
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'settings' ? currentTheme.navActive : currentTheme.navInactive}`}
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
          {user?.email === 'mnjkairi1@gmail.com' && (
            <button 
              onClick={() => {
                setActiveTab('superadmin');
                if (!superAdminFetched) fetchSuperAdminData();
              }}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'superadmin' ? currentTheme.navActive : currentTheme.navInactive}`}
            >
              <Shield className="w-5 h-5" />
              Super Admin
            </button>
          )}
        </nav>
      </aside>

      {/* Mobile Header */}
      <header className={`md:hidden ${currentTheme.sidebar} p-4 sticky top-0 z-30 transition-colors duration-500`}>
        <h2 className={`text-xl font-black ${currentTheme.text} flex items-center justify-center gap-2 tracking-tight`}>
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
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 ${currentTheme.sidebar} p-4 pb-safe z-30 flex justify-around items-center shadow-[0_-8px_32px_0_rgba(31,38,135,0.05)] transition-colors duration-500`}>
        <button 
          onClick={() => setActiveTab('shops')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'shops' ? currentTheme.navActive : currentTheme.navInactive}`}
        >
          <Store className="w-6 h-6" />
          <span className="text-[10px] font-bold">Shops</span>
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'analytics' ? currentTheme.navActive : currentTheme.navInactive}`}
        >
          <BarChart3 className="w-6 h-6" />
          <span className="text-[10px] font-bold">Analytics</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'settings' ? currentTheme.navActive : currentTheme.navInactive}`}
        >
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-bold">Settings</span>
        </button>
        {user?.email === 'mnjkairi1@gmail.com' && (
          <button 
            onClick={() => {
              setActiveTab('superadmin');
              if (!superAdminFetched) fetchSuperAdminData();
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'superadmin' ? currentTheme.navActive : currentTheme.navInactive}`}
          >
            <Shield className="w-6 h-6" />
            <span className="text-[10px] font-bold">Admin</span>
          </button>
        )}
      </nav>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${currentTheme.card} w-full max-w-md overflow-hidden`}>
            <div className="p-6 border-b border-white/20 flex justify-between items-center bg-white/50">
              <h2 className={`text-xl font-black ${currentTheme.text}`}>
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
                <label className={`block text-sm font-bold ${currentTheme.text} mb-2`}>Shop Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all font-medium text-slate-800"
                  placeholder="e.g. ABC Salon"
                />
              </div>
              <div>
                <label className={`block text-sm font-bold ${currentTheme.text} mb-2`}>Type</label>
                <input
                  type="text"
                  required
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all font-medium text-slate-800"
                  placeholder="e.g. Salon, Restaurant, Clinic"
                />
              </div>
              <div>
                <label className={`block text-sm font-bold ${currentTheme.text} mb-2`}>Keywords (comma separated)</label>
                <input
                  type="text"
                  required
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all font-medium text-slate-800"
                  placeholder="e.g. staff, cleanliness, haircut"
                />
              </div>
              <div>
                <label className={`block text-sm font-bold ${currentTheme.text} mb-2`}>Google Review Link</label>
                <input
                  type="url"
                  required
                  value={reviewLink}
                  onChange={(e) => setReviewLink(e.target.value)}
                  className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all font-medium text-slate-800"
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
                  className={`flex-1 px-5 py-4 rounded-2xl font-bold transition-opacity shadow-lg ${currentTheme.primaryBtn}`}
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
          <div className={`${currentTheme.card} w-full max-w-lg overflow-hidden`}>
            <div className="p-6 border-b border-white/20 flex justify-between items-center bg-white/50">
              <div>
                <h2 className={`text-xl font-black ${currentTheme.text}`}>Choose Theme</h2>
                <p className={`text-sm ${currentTheme.subtext} font-medium`}>Select a unique look for {selectedShopForTheme.name}</p>
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
                  const isSelected = (selectedShopForTheme.theme || 'mint-neumorphism') === theme.id;
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


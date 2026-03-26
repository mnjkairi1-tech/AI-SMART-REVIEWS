import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Copy, CheckCircle2, Store, Sparkles, Star, Edit2, ExternalLink } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { generateReviews } from '../lib/gemini';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Shop {
  id: string;
  name: string;
  type: string;
  keywords: string[];
  reviewLink: string;
  theme?: string;
}

const THEMES = {
  'mint-neumorphism': {
    bg: 'bg-[#e0f2eb]',
    card: 'bg-[#e0f2eb] shadow-[9px_9px_16px_#becece,-9px_-9px_16px_#ffffff] rounded-[25px] border-none',
    header: 'bg-[#e0f2eb] border-none shadow-[0_9px_16px_#becece] p-8 text-center relative overflow-hidden',
    headerText: 'text-teal-800',
    headerSubtext: 'text-teal-600/70',
    text: 'text-teal-800',
    subtext: 'text-teal-600/70',
    primaryBtn: 'bg-[#e0f2eb] shadow-[5px_5px_10px_#becece,-5px_-5px_10px_#ffffff] text-teal-700 hover:shadow-[inset_5px_5px_10px_#becece,inset_-5px_-5px_10px_#ffffff] rounded-2xl',
    secondaryBtn: 'bg-[#e0f2eb] shadow-[5px_5px_10px_#becece,-5px_-5px_10px_#ffffff] text-teal-600 hover:shadow-[inset_5px_5px_10px_#becece,inset_-5px_-5px_10px_#ffffff] rounded-2xl',
    secondaryBtnActive: 'shadow-[inset_5px_5px_10px_#becece,inset_-5px_-5px_10px_#ffffff] text-teal-800 rounded-2xl',
    accent: 'text-teal-500',
    iconBg: 'bg-[#e0f2eb] shadow-[inset_3px_3px_6px_#becece,inset_-3px_-3px_6px_#ffffff]',
    iconColor: 'text-teal-600',
    blobs: false
  },
  'dreamy-glass': {
    bg: 'bg-gradient-to-br from-[#e0f2eb] via-[#e0eaf5] to-[#f0f4f8]',
    card: 'bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_0_rgba(180,200,210,0.3)] rounded-[25px]',
    header: 'bg-white/30 backdrop-blur-xl border-b border-white/60 p-8 text-center relative overflow-hidden',
    headerText: 'text-slate-700',
    headerSubtext: 'text-slate-500',
    text: 'text-slate-700',
    subtext: 'text-slate-500',
    primaryBtn: 'bg-white/50 hover:bg-white/70 border border-white/60 text-teal-700 shadow-sm rounded-2xl',
    secondaryBtn: 'bg-white/40 hover:bg-white/60 text-slate-600 border border-white/50 rounded-2xl',
    secondaryBtnActive: 'bg-white/60 border-white/60 text-teal-700 shadow-sm rounded-2xl',
    accent: 'text-teal-400',
    iconBg: 'bg-white/50',
    iconColor: 'text-teal-500',
    blobs: true
  },
  'soft-glow': {
    bg: 'bg-[#f4fbf8]',
    card: 'bg-white backdrop-blur-md border border-teal-50 shadow-[0_0_20px_rgba(45,212,191,0.1)] rounded-[25px]',
    header: 'bg-white/80 border-b border-teal-100 shadow-[0_4px_24px_rgba(45,212,191,0.05)] p-8 text-center relative overflow-hidden',
    headerText: 'text-teal-900',
    headerSubtext: 'text-teal-600/80',
    text: 'text-teal-900',
    subtext: 'text-teal-600/80',
    primaryBtn: 'bg-teal-50 text-teal-600 border border-teal-200 shadow-[0_0_10px_rgba(45,212,191,0.2)] hover:shadow-[0_0_15px_rgba(45,212,191,0.4)] transition-all rounded-2xl',
    secondaryBtn: 'bg-white text-teal-600/70 border border-teal-100 hover:bg-teal-50/50 rounded-2xl',
    secondaryBtnActive: 'bg-teal-50 border-teal-100 text-teal-600 shadow-[0_0_10px_rgba(45,212,191,0.15)] rounded-2xl',
    accent: 'text-teal-400',
    iconBg: 'bg-teal-50 border border-teal-100 shadow-[0_0_10px_rgba(45,212,191,0.2)]',
    iconColor: 'text-teal-500',
    blobs: false
  },
  'bubble-pastel': {
    bg: 'bg-[#ebf7f3]',
    card: 'bg-white rounded-[35px] border-4 border-[#d1efe3] shadow-none',
    header: 'bg-[#e0f2eb] border-b-4 border-[#d1efe3] p-8 text-center relative overflow-hidden',
    headerText: 'text-teal-800',
    headerSubtext: 'text-teal-500',
    text: 'text-teal-800',
    subtext: 'text-teal-500',
    primaryBtn: 'bg-gradient-to-r from-[#86e3ce] to-[#6ee7b7] text-teal-900 rounded-full shadow-[0_4px_0_#34d399] active:translate-y-[4px] active:shadow-none transition-all',
    secondaryBtn: 'bg-white text-teal-600 rounded-full hover:bg-[#d1efe3]/30 border-2 border-[#d1efe3]',
    secondaryBtnActive: 'bg-[#d1efe3] border-[#86e3ce] text-teal-800 rounded-full',
    accent: 'text-[#34d399]',
    iconBg: 'bg-[#d1efe3] border-2 border-[#86e3ce] rounded-full',
    iconColor: 'text-teal-600',
    blobs: false
  },
  'calm-minimal': {
    bg: 'bg-[#f9fcfb]',
    card: 'bg-white border border-[#e2f0eb] shadow-sm rounded-[25px]',
    header: 'bg-white border-b border-[#e2f0eb] p-8 text-center relative overflow-hidden',
    headerText: 'text-slate-700 font-light',
    headerSubtext: 'text-slate-500 font-light',
    text: 'text-slate-700 font-light',
    subtext: 'text-slate-500 font-light',
    primaryBtn: 'bg-[#eef8f4] text-teal-700 hover:bg-[#e2f0eb] font-light tracking-wide rounded-2xl',
    secondaryBtn: 'bg-white border border-[#e2f0eb] text-slate-500 hover:bg-[#f4fbf8] rounded-2xl',
    secondaryBtnActive: 'bg-[#eef8f4] text-teal-800 border-none rounded-2xl',
    accent: 'text-teal-600',
    iconBg: 'bg-[#eef8f4] border border-[#e2f0eb]',
    iconColor: 'text-teal-600',
    blobs: false
  },
  'cyberpunk-neon': {
    bg: 'bg-gray-950',
    card: 'bg-gray-900/80 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)] rounded-xl',
    header: 'bg-gray-900 border-b border-cyan-500/30 p-8 text-center relative overflow-hidden',
    headerText: 'text-cyan-400',
    headerSubtext: 'text-cyan-600',
    text: 'text-cyan-400',
    subtext: 'text-cyan-600',
    primaryBtn: 'bg-gray-900 text-cyan-400 border border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.6)] transition-all',
    secondaryBtn: 'bg-gray-900 text-cyan-700 border border-cyan-900 hover:border-cyan-700',
    secondaryBtnActive: 'bg-gray-800 border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]',
    accent: 'text-cyan-400',
    iconBg: 'bg-gray-900 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]',
    iconColor: 'text-cyan-400',
    blobs: false
  },
  'sunset-gradient': {
    bg: 'bg-gradient-to-br from-orange-100 via-red-50 to-pink-100',
    card: 'bg-white/60 backdrop-blur-xl border border-orange-200/50 shadow-lg rounded-[2rem]',
    header: 'bg-white/40 border-b border-orange-200/50 p-8 text-center relative overflow-hidden',
    headerText: 'text-orange-900',
    headerSubtext: 'text-orange-700',
    text: 'text-orange-900',
    subtext: 'text-orange-700',
    primaryBtn: 'bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:opacity-90 shadow-md',
    secondaryBtn: 'bg-white/50 text-orange-600 border border-orange-200 hover:bg-white/80',
    secondaryBtnActive: 'bg-orange-100 border-orange-300 text-orange-800',
    accent: 'text-orange-500',
    iconBg: 'bg-white/80 border border-orange-200',
    iconColor: 'text-orange-500',
    blobs: true
  },
  'ocean-breeze': {
    bg: 'bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50',
    card: 'bg-white/70 backdrop-blur-xl border border-cyan-100 shadow-xl rounded-[2rem]',
    header: 'bg-white/50 border-b border-cyan-100 p-8 text-center relative overflow-hidden',
    headerText: 'text-cyan-900',
    headerSubtext: 'text-cyan-700',
    text: 'text-cyan-900',
    subtext: 'text-cyan-700',
    primaryBtn: 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-md',
    secondaryBtn: 'bg-white/60 text-cyan-600 border border-cyan-200 hover:bg-white/90',
    secondaryBtnActive: 'bg-cyan-100 border-cyan-300 text-cyan-800',
    accent: 'text-cyan-600',
    iconBg: 'bg-white/90 border border-cyan-100',
    iconColor: 'text-cyan-600',
    blobs: true
  },
  'midnight-monolith': {
    bg: 'bg-black',
    card: 'bg-[#111] border border-gray-800 rounded-2xl shadow-2xl',
    header: 'bg-[#0a0a0a] border-b border-gray-800 p-8 text-center relative overflow-hidden',
    headerText: 'text-gray-100',
    headerSubtext: 'text-gray-400',
    text: 'text-gray-100',
    subtext: 'text-gray-400',
    primaryBtn: 'bg-white text-black hover:bg-gray-200 rounded-lg',
    secondaryBtn: 'bg-[#111] text-gray-500 border border-gray-800 hover:bg-gray-900',
    secondaryBtnActive: 'bg-gray-900 border-gray-700 text-white',
    accent: 'text-white',
    iconBg: 'bg-[#111] border border-gray-800',
    iconColor: 'text-white',
    blobs: false
  },
  'default': {
    bg: 'bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100',
    card: 'bg-white/60 backdrop-blur-2xl border border-white/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-[2.5rem]',
    header: 'bg-gradient-to-tr from-pink-500 to-purple-600 p-8 text-center relative overflow-hidden',
    headerText: 'text-white',
    headerSubtext: 'text-pink-100',
    text: 'text-slate-800',
    subtext: 'text-slate-500',
    primaryBtn: 'bg-pink-100 text-pink-700 hover:bg-pink-200',
    secondaryBtn: 'bg-white/50 border-2 border-white text-slate-500 hover:bg-white/80',
    secondaryBtnActive: 'bg-pink-100 border-pink-400 text-pink-700',
    accent: 'text-pink-500',
    iconBg: 'bg-white/20 backdrop-blur-md border border-white/30 shadow-inner',
    iconColor: 'text-white',
    blobs: true
  }
};

const CATEGORIES = ['Staff', 'Cleanliness', 'Service', 'Price', 'Vibe'];

export default function ShopReview() {
  const { shopId } = useParams<{ shopId: string }>();
  const [searchParams] = useSearchParams();
  
  // Parse initial data from URL if available
  const initialData = (() => {
    const d = searchParams.get('d');
    if (d) {
      try {
        const parsed = JSON.parse(decodeURIComponent(atob(d)));
        return {
          id: shopId || '',
          name: parsed.n || '',
          type: parsed.t || '',
          keywords: parsed.k || '',
          reviewLink: parsed.l || '',
          theme: parsed.th || 'mint-neumorphism'
        };
      } catch (e) {
        console.error("Failed to parse initial data", e);
        return null;
      }
    }
    return null;
  })();

  const [shop, setShop] = useState<Shop | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  const [generatedReviews, setGeneratedReviews] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedReviewText, setEditedReviewText] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  const [manualReview, setManualReview] = useState('');
  const [manualCopied, setManualCopied] = useState(false);

  useEffect(() => {
    const fetchShop = async () => {
      if (!shopId) return;

      // 1. Try to load theme from localStorage instantly if no initialData
      if (!initialData) {
        const cachedTheme = localStorage.getItem(`theme_${shopId}`);
        if (cachedTheme) {
          setShop(prev => prev ? { ...prev, theme: cachedTheme } : { id: shopId, name: '', type: '', keywords: [], reviewLink: '', theme: cachedTheme } as Shop);
        }
      }

      try {
        const docRef = doc(db, 'shops', shopId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const shopData = { id: docSnap.id, ...docSnap.data() } as Shop;
          setShop(shopData);
          // 2. Cache the latest theme
          if (shopData.theme) {
            localStorage.setItem(`theme_${shopId}`, shopData.theme);
          }
        } else {
          toast.error('Shop not found');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `shops/${shopId}`);
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, [shopId, initialData]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleStarClick = async (rating: number) => {
    if (!shop) return;
    setSelectedRating(rating);
    
    if (rating >= 3) {
      setIsGenerating(true);
      setStep(2); // Loading step
      try {
        const reviews = await generateReviews(
          shop.name,
          shop.type,
          shop.keywords,
          rating,
          selectedCategories
        );
        setGeneratedReviews(reviews);
        logInteraction(rating, selectedCategories, true);
        setStep(3); // Reviews step
      } catch (error: any) {
        toast.error(error?.message || 'Failed to generate reviews. Please try again.');
        setStep(1);
      } finally {
        setIsGenerating(false);
      }
    } else {
      // 1 or 2 stars -> Manual text box
      logInteraction(rating, selectedCategories, false);
      setStep(4);
    }
  };

  const logInteraction = async (r: number, cats: string[], generated: boolean) => {
    if (!shopId) return;
    try {
      await addDoc(collection(db, 'logs'), {
        shopId,
        rating: r,
        categories: cats,
        reviewGenerated: generated,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to log interaction", error);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copied! Redirecting to Google...');
    
    setTimeout(() => {
      if (shop?.reviewLink) {
        window.location.href = shop.reviewLink;
      }
    }, 1500);
  };

  const handleManualCopy = () => {
    navigator.clipboard.writeText(manualReview);
    setManualCopied(true);
    toast.success('Copied! Redirecting to Google...');
    
    setTimeout(() => {
      if (shop?.reviewLink) {
        window.location.href = shop.reviewLink;
      }
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e0f2eb] flex items-center justify-center p-6 overflow-hidden">
        <div className="flex flex-col items-center justify-center relative">
          {/* Bouncing Liquid Bubble */}
          <motion.div
            animate={{
              y: [0, -30, 0],
              scaleX: [1, 0.85, 1.15, 1],
              scaleY: [1, 1.15, 0.85, 1],
              borderRadius: [
                "40% 60% 70% 30% / 40% 50% 60% 50%",
                "60% 40% 30% 70% / 60% 30% 70% 40%",
                "50% 50% 50% 50% / 50% 50% 50% 50%",
                "40% 60% 70% 30% / 40% 50% 60% 50%"
              ]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-24 h-24 bg-gradient-to-br from-[#86e3ce] to-[#6ee7b7] shadow-[8px_8px_16px_#becece,-8px_-8px_16px_#ffffff] mb-8 relative flex flex-col items-center justify-center z-10"
          >
            {/* Cute face inside the bubble */}
            <div className="flex gap-3 mt-2">
              <motion.div 
                animate={{ scaleY: [1, 0.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", times: [0, 0.05, 0.1] }}
                className="w-2.5 h-3.5 bg-teal-900 rounded-full" 
              />
              <motion.div 
                animate={{ scaleY: [1, 0.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", times: [0, 0.05, 0.1] }}
                className="w-2.5 h-3.5 bg-teal-900 rounded-full" 
              />
            </div>
            {/* Smile */}
            <div className="w-4 h-2 border-b-2 border-teal-900 rounded-full mt-1" />
          </motion.div>
          
          {/* Shadow under the bubble */}
          <motion.div
            animate={{
              scale: [1, 0.6, 1],
              opacity: [0.3, 0.1, 0.3]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-16 h-3 bg-teal-900/20 rounded-[100%] blur-[2px] mb-6 absolute top-[90px]"
          />

          <motion.p 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-teal-700 font-bold tracking-widest uppercase text-sm mt-4"
          >
            Loading experience...
          </motion.p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-6">
        <div className="text-center bg-white/60 backdrop-blur-xl p-10 rounded-[2rem] shadow-xl border border-white/50">
          <Store className="w-16 h-16 text-pink-300 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-slate-800">Shop not found</h1>
          <p className="text-slate-500 mt-2 font-medium">The QR code might be invalid or expired.</p>
        </div>
      </div>
    );
  }

  const displayShop = shop;
  const currentTheme = THEMES[(displayShop.theme as keyof typeof THEMES)] || THEMES['mint-neumorphism'];
  const isSimpleMode = searchParams.get('mode') === 'simple';

  if (isSimpleMode) {
    return (
      <div className={`min-h-screen ${currentTheme.bg} flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden transition-colors duration-500`}>
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className={`w-full max-w-md ${currentTheme.card} overflow-hidden relative z-10 p-8 text-center`}
        >
          <div className={`w-20 h-20 ${currentTheme.iconBg} rounded-3xl flex items-center justify-center mx-auto mb-6`}>
            <Store className={`w-10 h-10 ${currentTheme.iconColor}`} />
          </div>
          <h1 className={`text-3xl font-black ${currentTheme.headerText} mb-2`}>How was your experience?</h1>
          <p className={`${currentTheme.subtext} font-medium mb-8`}>We'd love to hear your feedback about {displayShop.name}.</p>
          
          <a
            href={displayShop.reviewLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 ${currentTheme.primaryBtn}`}
          >
            Click Here to Review <ExternalLink className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${currentTheme.bg} flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden transition-colors duration-500`}>
      {/* Decorative blobs */}
      {currentTheme.blobs && (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-pink-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-blue-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
        className={`w-full max-w-md ${currentTheme.card} overflow-hidden relative z-10 transition-all duration-500`}
      >
        
        {/* Header */}
        <div className={currentTheme.header}>
          {currentTheme.blobs && (
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          )}
          <div className="relative z-10">
            <motion.div 
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
              className={`w-16 h-16 ${currentTheme.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-3`}
            >
              <Store className={`w-8 h-8 ${currentTheme.iconColor}`} />
            </motion.div>
            <h1 className={`text-2xl font-black ${currentTheme.headerText} mb-1 tracking-tight drop-shadow-sm`}>{displayShop.name}</h1>
            <p className={`text-xs font-bold uppercase tracking-wider ${currentTheme.headerSubtext}`}>{displayShop.type}</p>
          </div>
        </div>

        <div className="p-6 sm:p-8 min-h-[300px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {/* Step 1: Star Rating & Categories */}
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-2"
              >
                <div className="mb-8">
                  <p className={`text-xs font-bold ${currentTheme.subtext} mb-3 uppercase tracking-wider`}>What stood out? (Optional)</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-bold transition-all border-2",
                          selectedCategories.includes(cat) 
                            ? currentTheme.secondaryBtnActive 
                            : currentTheme.secondaryBtn
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <h2 className={`text-2xl font-black ${currentTheme.text} mb-2`}>How was your experience?</h2>
                <p className={`${currentTheme.subtext} font-medium mb-6`}>Tap a star to rate your visit</p>
                
                <div className="flex justify-center gap-2 sm:gap-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => handleStarClick(star)}
                      className="group relative"
                    >
                      <Star 
                        className={cn(
                          "w-12 h-12 sm:w-14 sm:h-14 transition-all duration-300",
                          (hoveredRating ? hoveredRating >= star : selectedRating >= star)
                            ? `fill-current ${currentTheme.accent} drop-shadow-md` 
                            : "fill-slate-100 text-slate-200"
                        )} 
                      />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Generating Loading State */}
            {step === 2 && isGenerating && (
              <motion.div 
                key="step2-loading"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-12"
              >
                <div className="relative w-24 h-24 mx-auto mb-8">
                  <div className={`absolute inset-0 border-4 ${currentTheme.bg} rounded-full`}></div>
                  <div className={`absolute inset-0 border-4 ${currentTheme.accent.replace('text-', 'border-')} rounded-full border-t-transparent animate-spin`}></div>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 m-auto w-10 h-10 flex items-center justify-center"
                  >
                    <Sparkles className={`w-8 h-8 ${currentTheme.accent}`} />
                  </motion.div>
                </div>
                <h2 className={`text-2xl font-black ${currentTheme.text} mb-2`}>Crafting magic...</h2>
                <p className={`${currentTheme.subtext} font-medium`}>Using AI to write the perfect words ✨</p>
              </motion.div>
            )}

            {/* Step 3: Show Reviews */}
            {step === 3 && !isGenerating && generatedReviews.length > 0 && (
              <motion.div 
                key="step3-results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col h-full"
              >
                <div className="text-center mb-6">
                  <h2 className={`text-2xl font-black ${currentTheme.text}`}>Pick your favorite</h2>
                  <p className={`${currentTheme.subtext} font-medium mt-1 text-sm`}>Select, copy, and paste on Google.</p>
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 pb-4 custom-scrollbar">
                  {generatedReviews.map((review, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={cn(
                        "w-full bg-white/60 border-2 rounded-2xl p-4 shadow-sm transition-all",
                        copiedIndex === idx ? "border-green-400 bg-green-50/50" : "border-white hover:border-pink-200"
                      )}
                    >
                      {editingIndex === idx ? (
                        <textarea
                          value={editedReviewText}
                          onChange={(e) => setEditedReviewText(e.target.value)}
                          className="w-full h-24 p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 resize-none mb-3"
                          autoFocus
                        />
                      ) : (
                        <p className="text-slate-700 text-sm leading-relaxed font-medium mb-4">{review}</p>
                      )}
                      
                      <div className="flex gap-2">
                        {editingIndex === idx ? (
                          <button 
                            onClick={() => {
                              const newReviews = [...generatedReviews];
                              newReviews[idx] = editedReviewText;
                              setGeneratedReviews(newReviews);
                              setEditingIndex(null);
                            }}
                            className="flex-1 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors"
                          >
                            Save
                          </button>
                        ) : (
                          <button 
                            onClick={() => {
                              setEditingIndex(idx);
                              setEditedReviewText(review);
                              setCopiedIndex(null);
                            }}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${currentTheme.secondaryBtn}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                        )}
                        
                        <button 
                          onClick={() => handleCopy(editingIndex === idx ? editedReviewText : review, idx)}
                          className={cn(
                            "flex-1 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5",
                            copiedIndex === idx 
                              ? "bg-green-500 text-white" 
                              : currentTheme.primaryBtn
                          )}
                        >
                          {copiedIndex === idx ? (
                            <>Redirecting... ✅</>
                          ) : (
                            <><Copy className="w-3.5 h-3.5" /> Copy & Submit</>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 4: Manual Text (1 or 2 stars) */}
            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-6">
                  <h2 className={`text-2xl font-black ${currentTheme.text}`}>We're sorry to hear that</h2>
                  <p className={`${currentTheme.subtext} font-medium mt-1 text-sm`}>Please let us know how we can improve.</p>
                </div>
                
                <textarea
                  value={manualReview}
                  onChange={(e) => setManualReview(e.target.value)}
                  placeholder="Write your feedback here..."
                  className="w-full h-32 p-4 bg-white/80 border-2 border-white rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-400 outline-none resize-none text-slate-700 text-sm leading-relaxed mb-4 shadow-inner font-medium"
                />

                <div className="space-y-3">
                  <button
                    onClick={handleManualCopy}
                    disabled={!manualReview.trim()}
                    className={cn(
                      "w-full py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2",
                      manualCopied 
                        ? "bg-green-500 text-white" 
                        : manualReview.trim() 
                          ? currentTheme.primaryBtn 
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    {manualCopied ? 'Redirecting... ✅' : <><Copy className="w-4 h-4" /> Copy & Submit</>}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      
      <div className={`mt-8 text-center ${currentTheme.subtext} text-xs font-bold tracking-widest uppercase relative z-10`}>
        Powered by SMART AI REVIEWS
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
    card: 'bg-[#e0f2eb] shadow-[8px_8px_16px_#becece,-8px_-8px_16px_#ffffff] rounded-[30px] border-none',
    header: 'bg-[#e0f2eb] border-b border-[#becece]/30 p-8 text-center relative overflow-hidden',
    headerText: 'text-teal-800',
    headerSubtext: 'text-teal-600',
    text: 'text-teal-900',
    subtext: 'text-teal-600',
    primaryBtn: 'bg-[#e0f2eb] shadow-[5px_5px_10px_#becece,-5px_-5px_10px_#ffffff] text-teal-700 hover:shadow-[inset_5px_5px_10px_#becece,inset_-5px_-5px_10px_#ffffff]',
    secondaryBtn: 'bg-[#e0f2eb] shadow-[5px_5px_10px_#becece,-5px_-5px_10px_#ffffff] text-teal-600',
    secondaryBtnActive: 'shadow-[inset_5px_5px_10px_#becece,inset_-5px_-5px_10px_#ffffff] text-teal-800',
    accent: 'text-teal-500',
    iconBg: 'bg-[#e0f2eb] shadow-[inset_2px_2px_5px_#becece,inset_-2px_-2px_5px_#ffffff]',
    iconColor: 'text-teal-500',
    blobs: false
  },
  'dreamy-glass': {
    bg: 'bg-gradient-to-br from-pink-200 via-purple-200 to-teal-200',
    card: 'bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] rounded-[2.5rem]',
    header: 'bg-white/20 border-b border-white/30 p-8 text-center relative overflow-hidden',
    headerText: 'text-slate-800',
    headerSubtext: 'text-slate-600',
    text: 'text-slate-800',
    subtext: 'text-slate-600',
    primaryBtn: 'bg-white/40 hover:bg-white/50 border border-white/50 text-purple-800 shadow-sm',
    secondaryBtn: 'bg-white/30 hover:bg-white/40 text-slate-700 border border-white/30',
    secondaryBtnActive: 'bg-white/60 border-white/80 text-purple-700',
    accent: 'text-purple-500',
    iconBg: 'bg-white/40 border border-white/50',
    iconColor: 'text-purple-500',
    blobs: true
  },
  'soft-glow': {
    bg: 'bg-slate-900',
    card: 'bg-slate-800/80 backdrop-blur-md border border-slate-700 shadow-[0_0_20px_rgba(236,72,153,0.15)] rounded-[2.5rem]',
    header: 'bg-slate-800/50 border-b border-slate-700 p-8 text-center relative overflow-hidden',
    headerText: 'text-white',
    headerSubtext: 'text-pink-400',
    text: 'text-white',
    subtext: 'text-slate-400',
    primaryBtn: 'bg-slate-800 text-pink-400 border border-pink-500/30 shadow-[0_0_10px_rgba(236,72,153,0.3)] hover:shadow-[0_0_20px_rgba(236,72,153,0.6)] transition-shadow',
    secondaryBtn: 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500',
    secondaryBtnActive: 'bg-slate-700 border-pink-500/50 text-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.2)]',
    accent: 'text-pink-400',
    iconBg: 'bg-slate-800 border border-slate-700 shadow-[0_0_15px_rgba(236,72,153,0.2)]',
    iconColor: 'text-pink-400',
    blobs: false
  },
  'bubble-pastel': {
    bg: 'bg-pink-50',
    card: 'bg-white rounded-[40px] border-4 border-pink-200 shadow-none',
    header: 'bg-pink-100 border-b-4 border-pink-200 p-8 text-center relative overflow-hidden',
    headerText: 'text-pink-600',
    headerSubtext: 'text-pink-400',
    text: 'text-slate-800',
    subtext: 'text-slate-500',
    primaryBtn: 'bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-full shadow-[0_4px_0_rgb(219,39,119)] active:translate-y-[4px] active:shadow-none transition-all',
    secondaryBtn: 'bg-pink-50 text-pink-600 rounded-full hover:bg-pink-100 border-2 border-pink-200',
    secondaryBtnActive: 'bg-pink-200 border-pink-400 text-pink-700',
    accent: 'text-pink-500',
    iconBg: 'bg-white border-2 border-pink-200 rounded-full',
    iconColor: 'text-pink-500',
    blobs: false
  },
  'calm-minimal': {
    bg: 'bg-[#fdfbf7]',
    card: 'bg-white border border-slate-100 shadow-sm rounded-3xl',
    header: 'bg-[#fdfbf7] border-b border-slate-100 p-8 text-center relative overflow-hidden',
    headerText: 'text-slate-800 font-light',
    headerSubtext: 'text-slate-500 font-light',
    text: 'text-slate-800 font-light',
    subtext: 'text-slate-500 font-light',
    primaryBtn: 'bg-[#f0ece1] text-slate-700 hover:bg-[#e6e0d4] font-light tracking-wide rounded-2xl',
    secondaryBtn: 'bg-transparent border border-[#f0ece1] text-slate-500 hover:bg-[#fdfbf7] rounded-2xl',
    secondaryBtnActive: 'bg-[#f0ece1] text-slate-800 border-[#e6e0d4]',
    accent: 'text-[#d4c5b0]',
    iconBg: 'bg-[#fdfbf7] border border-slate-100',
    iconColor: 'text-slate-600',
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
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  
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
      try {
        const docRef = doc(db, 'shops', shopId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const shopData = { id: docSnap.id, ...docSnap.data() } as Shop;
          setShop(shopData);
          setLoading(false);
        } else {
          toast.error('Shop not found');
          setLoading(false);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `shops/${shopId}`);
        setLoading(false);
      }
    };
    fetchShop();
  }, [shopId]);

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-slate-800 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-500 font-medium animate-pulse">Loading experience...</p>
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
  const currentTheme = THEMES[(displayShop.theme as keyof typeof THEMES)] || THEMES['default'];

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

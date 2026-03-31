import { Link, useNavigate } from 'react-router-dom';
import { QrCode, Star, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

const DASHBOARD_THEMES = {
  'default': {
    bg: 'bg-slate-50',
    text: 'text-slate-900',
    subtext: 'text-slate-600',
    primaryBtn: 'bg-slate-900 text-white hover:bg-slate-800',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    card: 'bg-transparent'
  },
  'mint-neumorphism': {
    bg: 'bg-[#e0f2eb]',
    text: 'text-teal-800',
    subtext: 'text-teal-600/70',
    primaryBtn: 'bg-[#e0f2eb] text-teal-700 shadow-[5px_5px_10px_#becece,-5px_-5px_10px_#ffffff] hover:shadow-[inset_5px_5px_10px_#becece,inset_-5px_-5px_10px_#ffffff] rounded-2xl',
    iconBg: 'bg-[#e0f2eb] shadow-[inset_5px_5px_10px_#becece,inset_-5px_-5px_10px_#ffffff]',
    iconColor: 'text-teal-600',
    card: 'bg-[#e0f2eb] rounded-[25px] shadow-[9px_9px_16px_#becece,-9px_-9px_16px_#ffffff] border-none'
  },
  'dreamy-glass': {
    bg: 'bg-gradient-to-br from-[#e0f2eb] to-[#f0f4f8]',
    text: 'text-slate-700',
    subtext: 'text-slate-500',
    primaryBtn: 'bg-white/40 text-slate-700 hover:bg-white/60 border border-white/50 backdrop-blur-md',
    iconBg: 'bg-white/40 backdrop-blur-md border border-white/50',
    iconColor: 'text-blue-400',
    card: 'bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl'
  },
  'soft-glow': {
    bg: 'bg-[#f4fbf8]',
    text: 'text-teal-900',
    subtext: 'text-teal-600',
    primaryBtn: 'bg-white text-teal-700 hover:shadow-[0_0_20px_rgba(20,184,166,0.3)] border border-teal-100',
    iconBg: 'bg-white border border-teal-100 shadow-[0_0_15px_rgba(20,184,166,0.2)]',
    iconColor: 'text-teal-500',
    card: 'bg-white border border-teal-100 shadow-[0_0_20px_rgba(20,184,166,0.1)] rounded-3xl'
  },
  'bubble-pastel': {
    bg: 'bg-[#ebf7f3]',
    text: 'text-teal-800',
    subtext: 'text-teal-600',
    primaryBtn: 'bg-white text-teal-600 hover:bg-teal-50 border-2 border-[#d1efe3] rounded-3xl',
    iconBg: 'bg-white border-2 border-[#d1efe3] rounded-full',
    iconColor: 'text-teal-400',
    card: 'bg-white border-2 border-[#d1efe3] rounded-3xl'
  },
  'calm-minimal': {
    bg: 'bg-[#f9fcfb]',
    text: 'text-slate-800',
    subtext: 'text-slate-500',
    primaryBtn: 'bg-white text-slate-700 hover:bg-slate-50 border border-[#e2f0eb]',
    iconBg: 'bg-white border border-[#e2f0eb]',
    iconColor: 'text-slate-400',
    card: 'bg-white border border-[#e2f0eb] rounded-3xl'
  },
  'cyberpunk-neon': {
    bg: 'bg-gray-900',
    text: 'text-cyan-400',
    subtext: 'text-cyan-600',
    primaryBtn: 'bg-gray-800 text-cyan-400 hover:bg-gray-700 border border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]',
    iconBg: 'bg-gray-800 border border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]',
    iconColor: 'text-cyan-300',
    card: 'bg-gray-800 border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] rounded-3xl'
  },
  'sunset-gradient': {
    bg: 'bg-gradient-to-br from-orange-50 to-pink-50',
    text: 'text-orange-900',
    subtext: 'text-orange-700/80',
    primaryBtn: 'bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:opacity-90',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-500',
    card: 'bg-white/80 backdrop-blur-sm border border-orange-100 shadow-xl shadow-orange-900/5 rounded-3xl'
  },
  'ocean-breeze': {
    bg: 'bg-gradient-to-br from-cyan-50 to-blue-50',
    text: 'text-cyan-900',
    subtext: 'text-cyan-700/80',
    primaryBtn: 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white hover:opacity-90',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    card: 'bg-white/80 backdrop-blur-sm border border-cyan-100 shadow-xl shadow-cyan-900/5 rounded-3xl'
  },
  'midnight-monolith': {
    bg: 'bg-black',
    text: 'text-gray-100',
    subtext: 'text-gray-400',
    primaryBtn: 'bg-gray-900 text-white hover:bg-gray-800 border border-gray-800',
    iconBg: 'bg-gray-900 border border-gray-800',
    iconColor: 'text-gray-300',
    card: 'bg-gray-900 border border-gray-800 rounded-3xl'
  }
};

export default function Landing() {
  const [themeId, setThemeId] = useState('mint-neumorphism');
  const navigate = useNavigate();

  useEffect(() => {
    const hasVisitedAdmin = localStorage.getItem('hasVisitedAdmin');
    if (hasVisitedAdmin === 'true') {
      navigate('/admin');
      return;
    }

    const savedTheme = localStorage.getItem('dashboardTheme');
    if (savedTheme && DASHBOARD_THEMES[savedTheme as keyof typeof DASHBOARD_THEMES]) {
      setThemeId(savedTheme);
    }
  }, [navigate]);

  const currentTheme = DASHBOARD_THEMES[themeId as keyof typeof DASHBOARD_THEMES] || DASHBOARD_THEMES['mint-neumorphism'];

  return (
    <div className={`min-h-screen ${currentTheme.bg} flex flex-col items-center justify-center p-6 transition-colors duration-500`}>
      <div className="max-w-3xl w-full text-center space-y-8">
        <div className={`inline-flex items-center justify-center p-4 ${currentTheme.iconBg} rounded-full mb-4 transition-colors duration-500`}>
          <QrCode className={`w-12 h-12 ${currentTheme.iconColor}`} />
        </div>
        
        <h1 className={`text-5xl md:text-6xl font-extrabold ${currentTheme.text} tracking-tight transition-colors duration-500`}>
          AI SMART REVIEWS
        </h1>
        
        <p className={`text-xl ${currentTheme.subtext} max-w-2xl mx-auto leading-relaxed transition-colors duration-500`}>
          Get reviews based on your input with a natural human tone.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Link 
            to="/admin" 
            className={`w-full sm:w-auto px-8 py-4 ${currentTheme.primaryBtn} font-semibold text-lg transition-all flex items-center justify-center gap-2`}
          >
            Owner Dashboard
          </Link>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 mt-16 border-t ${themeId === 'midnight-monolith' || themeId === 'cyberpunk-neon' ? 'border-gray-800' : 'border-black/5'} transition-colors duration-500`}>
          <div className={`flex flex-col items-center text-center space-y-3 p-6 ${currentTheme.card} transition-colors duration-500`}>
            <div className={`w-12 h-12 ${currentTheme.iconBg} rounded-xl flex items-center justify-center transition-colors duration-500`}>
              <QrCode className={`w-6 h-6 ${currentTheme.iconColor}`} />
            </div>
            <h3 className={`text-lg font-bold ${currentTheme.text}`}>1. Scan QR</h3>
            <p className={currentTheme.subtext}>Customer scans the QR code at your shop.</p>
          </div>
          <div className={`flex flex-col items-center text-center space-y-3 p-6 ${currentTheme.card} transition-colors duration-500`}>
            <div className={`w-12 h-12 ${currentTheme.iconBg} rounded-xl flex items-center justify-center transition-colors duration-500`}>
              <Star className={`w-6 h-6 ${currentTheme.iconColor}`} />
            </div>
            <h3 className={`text-lg font-bold ${currentTheme.text}`}>2. Rate & Select</h3>
            <p className={currentTheme.subtext}>They choose a star rating and categories.</p>
          </div>
          <div className={`flex flex-col items-center text-center space-y-3 p-6 ${currentTheme.card} transition-colors duration-500`}>
            <div className={`w-12 h-12 ${currentTheme.iconBg} rounded-xl flex items-center justify-center transition-colors duration-500`}>
              <Zap className={`w-6 h-6 ${currentTheme.iconColor}`} />
            </div>
            <h3 className={`text-lg font-bold ${currentTheme.text}`}>3. AI Magic</h3>
            <p className={currentTheme.subtext}>AI generates a perfect review to copy-paste.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

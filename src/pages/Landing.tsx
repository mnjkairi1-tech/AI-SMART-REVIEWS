import { Link } from 'react-router-dom';
import { QrCode, Star, Zap } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full text-center space-y-8">
        <div className="inline-flex items-center justify-center p-4 bg-blue-100 rounded-full mb-4">
          <QrCode className="w-12 h-12 text-blue-600" />
        </div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
          AI Smart Review <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">QR System</span>
        </h1>
        
        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Boost your Google Reviews effortlessly. Customers scan, rate, and get AI-generated reviews to copy-paste in seconds.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Link 
            to="/admin" 
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-semibold text-lg hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2"
          >
            Owner Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 mt-16 border-t border-slate-200">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">1. Scan QR</h3>
            <p className="text-slate-600">Customer scans the QR code at your shop.</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">2. Rate & Select</h3>
            <p className="text-slate-600">They choose a star rating and categories.</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">3. AI Magic</h3>
            <p className="text-slate-600">AI generates a perfect review to copy-paste.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

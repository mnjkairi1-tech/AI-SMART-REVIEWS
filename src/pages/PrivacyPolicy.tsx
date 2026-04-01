import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6 md:p-12 font-sans relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-96 h-96 bg-pink-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 pointer-events-none"></div>
      <div className="fixed top-[20%] right-[-10%] w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 pointer-events-none"></div>
      <div className="fixed bottom-[-20%] left-[20%] w-96 h-96 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 pointer-events-none"></div>

      <div className="max-w-3xl mx-auto relative z-10">
        <Link to="/admin" className="inline-block mb-8 text-pink-600 font-bold hover:underline">
          &larr; Back to Dashboard
        </Link>
        
        <div className="bg-white/60 backdrop-blur-2xl rounded-[2rem] border border-white/50 p-8 md:p-12 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-pink-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-200 transform -rotate-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Privacy Policy</h1>
          </div>

          <div className="space-y-6 text-slate-600 font-medium leading-relaxed">
            <p>
              Welcome to SMART QR. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our application.
            </p>

            <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4">1. Information We Collect</h2>
            <p>
              We may collect information about you in a variety of ways. The information we may collect via the Application includes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, shipping address, email address, and telephone number, and demographic information.</li>
              <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Application, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Application.</li>
            </ul>

            <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4">2. Use of Your Information</h2>
            <p>
              Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Application to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Create and manage your account.</li>
              <li>Generate AI reviews based on user interactions.</li>
              <li>Compile anonymous statistical data and analysis for use internally or with third parties.</li>
              <li>Deliver targeted advertising, coupons, newsletters, and other information regarding promotions and the Application to you.</li>
            </ul>

            <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4">3. Disclosure of Your Information</h2>
            <p>
              We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others.</li>
              <li><strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including data analysis, email delivery, hosting services, customer service, and marketing assistance.</li>
            </ul>

            <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4">4. Contact Us</h2>
            <p>
              If you have questions or comments about this Privacy Policy, please contact us at support@smartaireviews.com.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

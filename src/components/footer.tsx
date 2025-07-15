'use client'

import Link from 'next/link'

export default function Footer() {
    return (
        <footer className="bg-slate-50 border-t border-slate-200">
            <div className="mx-auto max-w-7xl px-6 py-16">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
                    {/* Logo and Description */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">ES</span>
                            </div>
                            <span className="text-xl font-semibold font-['Inter_Tight'] text-slate-800">
                                Elite Speaks
                            </span>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed max-w-md">
                            Transform your English communication skills with our AI-powered platform. 
                            Build confidence, master pronunciation, and excel in professional environments.
                        </p>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h3 className="font-semibold text-slate-800 mb-4 font-['Inter_Tight']">Product</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="#" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                                    Features
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                                    Pricing
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                                    Learning Path
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                                    Progress Tracking
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h3 className="font-semibold text-slate-800 mb-4 font-['Inter_Tight']">Company</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="#" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                                    Careers
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support Links */}
                    <div>
                        <h3 className="font-semibold text-slate-800 mb-4 font-['Inter_Tight']">Support</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="#" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                                    Help Center
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                                    FAQ
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Large Elite Speaks Text Background */}
                <div className="relative mb-12">
                    <div className="text-center">
                        <h2 className="text-6xl md:text-8xl lg:text-9xl font-bold text-slate-100 select-none pointer-events-none font-['Inter_Tight']">
                            Elite Speaks
                        </h2>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-200">
                    <div className="flex items-center gap-6 mb-4 md:mb-0">
                        <p className="text-sm text-slate-600">
                            © 2025 Elite Speaks. All rights reserved.
                        </p>
                    </div>
                    
                    {/* Social Links */}
                    <div className="flex items-center gap-4">
                        <Link 
                            href="#" 
                            className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-colors"
                            aria-label="Twitter"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                        </Link>
                        <Link 
                            href="#" 
                            className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-colors"
                            aria-label="LinkedIn"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                        </Link>
                        <Link 
                            href="#" 
                            className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-colors"
                            aria-label="Instagram"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.618 5.367 11.986 11.988 11.986 6.618 0 11.986-5.368 11.986-11.986C24.003 5.367 18.635.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.611-3.132-1.551a3.989 3.989 0 01-.581-2.077c0-2.206 1.794-4.001 4.001-4.001 2.206 0 4.001 1.795 4.001 4.001 0 2.206-1.795 4.001-4.001 4.001-.687 0-1.332-.175-1.898-.483z"/>
                        </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}

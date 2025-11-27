import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Restaurant Management Blog | Order QR",
    description: "Tips, guides, and insights for restaurant owners. Learn how to optimize your operations with QR menus and KDS.",
};

const articles = [
    {
        slug: "benefits-of-qr-menu-for-restaurants",
        title: "7 Key Benefits of QR Code Menus for Restaurants in 2024",
        excerpt: "Discover how switching to digital QR menus can increase your table turnover, reduce printing costs, and boost average order value.",
        date: "2024-11-27",
        category: "Technology"
    },
    {
        slug: "how-to-reduce-food-waste-with-kds",
        title: "How a Kitchen Display System (KDS) Reduces Food Waste",
        excerpt: "Stop losing money on wrong orders. Learn how a KDS streamlines communication between front-of-house and kitchen staff.",
        date: "2024-11-26",
        category: "Operations"
    },
    {
        slug: "best-restaurant-management-systems",
        title: "Top Features to Look for in a Restaurant Management System",
        excerpt: "Not all POS systems are created equal. Here is the ultimate checklist for choosing the right software for your restaurant.",
        date: "2024-11-25",
        category: "Guide"
    }
];

export default function BlogIndex() {
    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
            {/* Nav */}
            <nav className="bg-white border-b">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="font-bold text-xl text-indigo-600">Order QR</Link>
                    <Link href="/" className="text-sm text-gray-600 hover:text-indigo-600">Back to Home</Link>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-16">
                <header className="mb-12 text-center">
                    <h1 className="text-4xl font-extrabold mb-4">Restaurant Success Blog</h1>
                    <p className="text-xl text-gray-600">Insights to help you run a smarter, more profitable restaurant.</p>
                </header>

                <div className="grid gap-8">
                    {articles.map(article => (
                        <article key={article.slug} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-medium">{article.category}</span>
                                <time>{new Date(article.date).toLocaleDateString()}</time>
                            </div>
                            <h2 className="text-2xl font-bold mb-3">
                                <Link href={`/blog/${article.slug}`} className="hover:text-indigo-600 transition-colors">
                                    {article.title}
                                </Link>
                            </h2>
                            <p className="text-gray-600 mb-4 leading-relaxed">
                                {article.excerpt}
                            </p>
                            <Link href={`/blog/${article.slug}`} className="text-indigo-600 font-semibold hover:underline">
                                Read Article →
                            </Link>
                        </article>
                    ))}
                </div>
            </main>

            <footer className="bg-white border-t mt-20 py-10 text-center text-gray-500 text-sm">
                © {new Date().getFullYear()} Order QR. All rights reserved.
            </footer>
        </div>
    );
}

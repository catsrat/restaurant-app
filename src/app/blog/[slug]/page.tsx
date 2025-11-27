import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

// Mock Data Store
const articles: Record<string, { title: string, content: string, date: string, category: string, description: string }> = {
    "benefits-of-qr-menu-for-restaurants": {
        title: "7 Key Benefits of QR Code Menus for Restaurants in 2024",
        date: "2024-11-27",
        category: "Technology",
        description: "Discover how switching to digital QR menus can increase your table turnover, reduce printing costs, and boost average order value.",
        content: `
            <p>The restaurant industry is evolving rapidly, and digital transformation is at the forefront. One of the most impactful changes has been the adoption of <strong>QR code menus</strong>. Here is why your restaurant needs to make the switch.</p>
            
            <h3>1. Contactless & Hygienic</h3>
            <p>Post-pandemic, customers prefer contactless options. QR menus eliminate the need for physical menus that change hands multiple times a day, ensuring a safer dining experience.</p>

            <h3>2. Instant Updates</h3>
            <p>Ran out of the special? Price change? With physical menus, this means re-printing. With a digital menu like <strong>Order QR</strong>, you can update items instantly from your dashboard.</p>

            <h3>3. Higher Average Order Value</h3>
            <p>Digital menus allow for rich visuals. Showing a high-quality photo of a dessert or cocktail makes it much more likely for a customer to order it compared to just reading text.</p>

            <h3>4. Faster Table Turnover</h3>
            <p>Customers don't have to wait for a server to bring a menu or take their order. They scan, order, and the kitchen gets started immediately. This saves 10-15 minutes per table.</p>

            <h3>5. Reduced Staff Workload</h3>
            <p>Servers can focus on hospitality and upselling rather than running back and forth with notepads. This improves staff morale and efficiency.</p>

            <h3>6. Data & Analytics</h3>
            <p>Know exactly what sells and when. Digital systems track every click and order, giving you insights to optimize your menu engineering.</p>

            <h3>7. Eco-Friendly</h3>
            <p>Save paper and save the planet. Reducing printing waste is a great step towards a more sustainable business model.</p>

            <p>Ready to upgrade? <a href="/" class="text-indigo-600 font-bold hover:underline">Start your free trial with Order QR today.</a></p>
        `
    },
    "how-to-reduce-food-waste-with-kds": {
        title: "How a Kitchen Display System (KDS) Reduces Food Waste",
        date: "2024-11-26",
        category: "Operations",
        description: "Stop losing money on wrong orders. Learn how a KDS streamlines communication between front-of-house and kitchen staff.",
        content: `
            <p>Food waste is one of the biggest profit killers in restaurants. A significant portion of this waste comes from communication errors between the front-of-house and the kitchen. Enter the <strong>Kitchen Display System (KDS)</strong>.</p>

            <h3>Eliminate Handwriting Errors</h3>
            <p>Illegible handwriting on paper tickets leads to wrong dishes being cooked. A KDS displays orders clearly, with modifications and allergies highlighted.</p>

            <h3>Real-Time Updates</h3>
            <p>If a customer changes their mind or adds an item, the KDS updates instantly. No need for a server to run into the kitchen screaming "Hold the onions!"</p>

            <h3>Course Management</h3>
            <p>A KDS helps chefs time courses perfectly. Appetizers, mains, and desserts can be fired at the right times, preventing food from sitting under heat lamps and drying out.</p>

            <h3>Inventory Tracking</h3>
            <p>Advanced systems link orders to inventory. If you run out of a key ingredient, the system can auto-86 the item from the menu, preventing orders that can't be fulfilled.</p>

            <p><strong>Order QR</strong> comes with a built-in KDS that works on any tablet. <a href="/" class="text-indigo-600 font-bold hover:underline">Try it for free.</a></p>
        `
    },
    "best-restaurant-management-systems": {
        title: "Top Features to Look for in a Restaurant Management System",
        date: "2024-11-25",
        category: "Guide",
        description: "Not all POS systems are created equal. Here is the ultimate checklist for choosing the right software for your restaurant.",
        content: `
            <p>Choosing the right software for your restaurant is a critical decision. The market is flooded with options, but what really matters? Here is a checklist of non-negotiable features.</p>

            <h3>1. Cloud-Based</h3>
            <p>Legacy systems that require a server in your back office are a nightmare. Choose a cloud-based system so you can access your data from anywhere.</p>

            <h3>2. Integrated Online Ordering</h3>
            <p>Don't pay extra for third-party aggregators if you don't have to. Your system should allow direct ordering for takeaway and delivery.</p>

            <h3>3. Kitchen Display System (KDS)</h3>
            <p>Paper tickets are a thing of the past. Ensure your system has a native KDS to streamline kitchen operations.</p>

            <h3>4. Inventory Management</h3>
            <p>Real-time tracking of stock levels helps you prevent theft and waste.</p>

            <h3>5. Multi-Currency & Multi-Location</h3>
            <p>If you plan to scale, you need a system that grows with you. Look for multi-currency support if you operate in tourist areas or across borders.</p>

            <p><strong>Order QR</strong> checks all these boxes and more. It's the all-in-one operating system for modern restaurants.</p>
        `
    }
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const article = articles[params.slug];
    if (!article) return { title: "Article Not Found" };

    return {
        title: `${article.title} | Order QR Blog`,
        description: article.description,
        openGraph: {
            title: article.title,
            description: article.description,
            type: 'article',
            publishedTime: article.date,
        }
    };
}

export default function BlogPost({ params }: { params: { slug: string } }) {
    const article = articles[params.slug];

    if (!article) {
        notFound();
    }

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": article.title,
        "datePublished": article.date,
        "author": {
            "@type": "Organization",
            "name": "Order QR Team"
        },
        "description": article.description
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-800">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Nav */}
            <nav className="border-b sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/blog" className="font-bold text-lg text-gray-900 hover:text-indigo-600">← Back to Blog</Link>
                    <Link href="/" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700">Get Started</Link>
                </div>
            </nav>

            <article className="max-w-3xl mx-auto px-6 py-16">
                <header className="mb-10">
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-medium">{article.category}</span>
                        <time>{new Date(article.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6 text-gray-900">{article.title}</h1>
                    <p className="text-xl text-gray-600 leading-relaxed">{article.description}</p>
                </header>

                <div
                    className="prose prose-lg prose-indigo max-w-none"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                />
            </article>

            <section className="bg-gray-50 py-16 mt-10">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold mb-4">Ready to modernize your restaurant?</h2>
                    <p className="text-gray-600 mb-8 text-lg">Join hundreds of restaurants using Order QR to streamline operations.</p>
                    <Link href="/" className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition-all">
                        Start Your Free Trial
                    </Link>
                </div>
            </section>

            <footer className="bg-white border-t py-10 text-center text-gray-500 text-sm">
                © {new Date().getFullYear()} Order QR. All rights reserved.
            </footer>
        </div>
    );
}

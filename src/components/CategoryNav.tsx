import { cn } from '@/lib/utils';
import { MenuCategory } from '@/types';

interface CategoryNavProps {
    categories: MenuCategory[];
    activeCategory: string;
    onSelect: (id: string) => void;
}

export function CategoryNav({ categories, activeCategory, onSelect }: CategoryNavProps) {
    return (
        <div className="sticky top-[72px] z-10 bg-gray-50/95 backdrop-blur-sm py-2 -mx-4 px-4 overflow-x-auto no-scrollbar flex gap-2 border-b border-gray-200/50">
            <button
                onClick={() => onSelect('all')}
                className={cn(
                    "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                    activeCategory === 'all'
                        ? "bg-black text-white shadow-md"
                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                )}
            >
                All Items
            </button>
            {categories.map(category => (
                <button
                    key={category.id}
                    onClick={() => onSelect(category.id)}
                    className={cn(
                        "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                        activeCategory === category.id
                            ? "bg-black text-white shadow-md"
                            : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                    )}
                >
                    {category.name}
                </button>
            ))}
        </div>
    );
}

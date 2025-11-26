import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
                className="pl-10 bg-white border-gray-200 focus:border-black focus:ring-black"
                placeholder="Search for dishes..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

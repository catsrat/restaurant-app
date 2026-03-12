import { supabase } from './supabase';

export async function uploadMenuItemImage(file: File, restaurantId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${restaurantId}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
        .from('menu-items')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        console.error("Error uploading image:", error);
        throw error;
    }

    const { data: publicUrlData } = supabase.storage
        .from('menu-items')
        .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
}

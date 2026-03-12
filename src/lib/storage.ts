import { supabase } from './supabase';
import imageCompression from 'browser-image-compression';

export async function uploadMenuItemImage(file: File, restaurantId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${restaurantId}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${fileName}`;

    // Compression options
    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
    };

    let fileToUpload = file;
    try {
        fileToUpload = await imageCompression(file, options);
    } catch (compressionError) {
        console.warn("Image compression failed, uploading original file.", compressionError);
    }

    const { data, error } = await supabase.storage
        .from('menu-items')
        .upload(filePath, fileToUpload, {
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

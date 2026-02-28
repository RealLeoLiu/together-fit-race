"use client";

import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Camera, Loader2 } from "lucide-react";
import Image from "next/image";

interface AvatarUploaderProps {
    userId: string;
    currentAvatarUrl: string | null;
    userName: string;
    /** Called with the fresh public URL after a successful upload */
    onAvatarUpdated?: (newUrl: string) => void;
    /** Size class, defaults to w-9 h-9 */
    sizeClass?: string;
    textSizeClass?: string;
    /** Additional classes for the avatar container (e.g. rings) */
    className?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function AvatarUploader({
    userId,
    currentAvatarUrl,
    userName,
    onAvatarUpdated,
    sizeClass = "w-9 h-9",
    textSizeClass = "text-sm",
    className = "",
}: AvatarUploaderProps) {
    const supabase = createClient();
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [localUrl, setLocalUrl] = useState<string | null>(currentAvatarUrl);
    const [hasMounted, setHasMounted] = useState(false);

    // Hydration guard
    useEffect(() => {
        setHasMounted(true);
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input so the same file can be re-selected
        e.target.value = "";

        if (file.size > MAX_FILE_SIZE) {
            toast.error("图片不能超过 5 MB");
            return;
        }

        setUploading(true);

        try {
            // Unique storage path per user, overwrite on re-upload
            const ext = file.name.split(".").pop() ?? "jpg";
            const path = `${userId}/avatar.${ext}`;

            // Upload (upsert = overwrite existing)
            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(path, file, { upsert: true, contentType: file.type });

            if (uploadError) throw new Error(uploadError.message);

            // Get the permanent public URL
            const { data: urlData } = supabase.storage
                .from("avatars")
                .getPublicUrl(path);

            const publicUrl = urlData.publicUrl;

            // Persist to the users table
            const { error: dbError } = await supabase
                .from("users")
                .update({ avatar_url: publicUrl })
                .eq("id", userId);

            if (dbError) throw new Error(dbError.message);

            // Optimistic local update
            setLocalUrl(publicUrl);
            onAvatarUpdated?.(publicUrl);
            toast.success("头像已更新 ✨");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "上传失败，请重试";
            toast.error(msg);
        } finally {
            setUploading(false);
        }
    };

    // Use Array.from for emoji-safe slicing to avoid hydration mismatch on surrogate pairs
    const initials = Array.from(userName)[0]?.toUpperCase() || "?";

    if (!hasMounted) {
        return (
            <div className={`${sizeClass} rounded-full bg-gray-100 animate-pulse ${className}`} />
        );
    }

    return (
        <div className={`relative group flex-shrink-0 ${sizeClass}`}>
            {/* Avatar circle */}
            <div
                className={`w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-violet-200 to-pink-200 flex items-center justify-center shadow-sm ${className || 'ring-2 ring-white'}`}
            >
                {localUrl ? (
                    <Image
                        src={localUrl}
                        alt={userName}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover block"
                        unoptimized
                    />
                ) : (
                    <span className={`${textSizeClass} font-bold text-violet-600`}>
                        {initials}
                    </span>
                )}
            </div>

            {/* Upload overlay — visible on group hover or during upload */}
            <button
                type="button"
                onClick={() => !uploading && inputRef.current?.click()}
                aria-label="更换头像"
                className={`
                    absolute inset-0 rounded-full
                    flex items-center justify-center
                    bg-black/40 backdrop-blur-[1px]
                    opacity-0 group-hover:opacity-100
                    transition-opacity duration-200
                    cursor-pointer
                    ${uploading ? "opacity-100 cursor-default" : ""}
                `}
            >
                {uploading ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                    <Camera className="w-4 h-4 text-white drop-shadow" />
                )}
            </button>

            {/* Hidden file input */}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    );
}

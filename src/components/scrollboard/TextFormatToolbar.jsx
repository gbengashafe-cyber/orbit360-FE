import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Bold } from 'lucide-react';
import { cn } from '@/lib/utils';

const fontSizes = [12, 16, 24, 36, 48, 64];
const fontFamilies = ['Arial', 'Verdana', 'Georgia', 'Times New Roman', 'Courier New'];

export default function TextFormatToolbar({ object, onStyleChange, theme }) {
    if (!object || object.type !== 'text') {
        return null;
    }

    const style = object.style || {};
    const isBold = style.fontWeight === 'bold';
    const defaultTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';

    return (
        <div 
            className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 flex items-center gap-2 z-50 border"
        >
            {/* Font Size Select */}
            <Select 
                value={String(style.fontSize || 24)} 
                onValueChange={(value) => onStyleChange({ fontSize: Number(value) })}
            >
                <SelectTrigger className="w-20">
                    <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                    {fontSizes.map(size => (
                        <SelectItem key={size} value={String(size)}>{size}px</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Font Family Select */}
            <Select 
                value={style.fontFamily || 'Arial'}
                onValueChange={(value) => onStyleChange({ fontFamily: value })}
            >
                <SelectTrigger className="w-32">
                    <SelectValue placeholder="Font" />
                </SelectTrigger>
                <SelectContent>
                    {fontFamilies.map(font => (
                        <SelectItem key={font} value={font} style={{ fontFamily: font }}>{font}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div className="h-6 w-px bg-gray-200 mx-1"></div>

            {/* Color Picker */}
            <div className="relative w-8 h-8 flex items-center justify-center">
                <input
                    type="color"
                    value={style.color || defaultTextColor}
                    onChange={(e) => onStyleChange({ color: e.target.value })}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Change text color"
                />
                <div
                    className="w-5 h-5 rounded-full border border-gray-300"
                    style={{ backgroundColor: style.color || defaultTextColor }}
                ></div>
            </div>

            {/* Bold Button */}
            <Button
                variant="ghost"
                size="icon"
                className={cn('h-8 w-8', isBold && 'bg-blue-100 text-blue-700')}
                onClick={() => onStyleChange({ fontWeight: isBold ? 'normal' : 'bold' })}
                title="Bold"
            >
                <Bold className="w-4 h-4" />
            </Button>
        </div>
    );
}
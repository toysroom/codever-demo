import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages } from 'lucide-react';
import { HTMLAttributes } from 'react';
import { type SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';

interface LanguageToggleDropdownProps extends HTMLAttributes<HTMLDivElement> {
    currentLocale?: string;
    availableLocales?: Record<string, string>;
}

export default function LanguageToggleDropdown({
    className = '',
    currentLocale: propCurrentLocale,
    availableLocales: propAvailableLocales,
    ...props
}: LanguageToggleDropdownProps) {
    const page = usePage<SharedData>();
    const { currentLocale: sharedCurrentLocale, availableLocales: sharedAvailableLocales } = page.props;

    const currentLocale = propCurrentLocale || sharedCurrentLocale || 'it';
    const availableLocales = propAvailableLocales || sharedAvailableLocales || { it: 'Italiano', en: 'English' };

    const handleLocaleChange = (locale: string) => {
        router.post(
            '/locale',
            { locale },
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ preserveScroll: true });
                },
            },
        );
    };

    const currentLocaleName = availableLocales[currentLocale] || currentLocale.toUpperCase();

    return (
        <div className={className} {...props}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-md"
                    >
                        <Languages className="h-5 w-5" />
                        <span className="sr-only">{`Change language (${currentLocaleName})`}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {Object.entries(availableLocales).map(([code, name]) => (
                        <DropdownMenuItem
                            key={code}
                            onClick={() => handleLocaleChange(code)}
                            className={currentLocale === code ? 'bg-accent' : ''}
                        >
                            <span className="flex items-center gap-2">
                                {String(name)}
                                {currentLocale === code && (
                                    <span className="ml-auto text-xs">✓</span>
                                )}
                            </span>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

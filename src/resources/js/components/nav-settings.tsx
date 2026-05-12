import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { isNavItemActive, isSidebarNavItemActive } from '@/lib/utils';
import { type SharedData, type SidebarNavIcon, type SidebarNavItem } from '@/types';
import { type InertiaLinkProps, Link, usePage } from '@inertiajs/react';
import {
    Building2,
    ChevronRight,
    Database,
    FileText,
    Info,
    Layers,
    Package,
    Settings2,
    Shield,
    SlidersHorizontal,
    User,
    UserPlus,
    type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const settingsIconComponents: Record<Exclude<SidebarNavIcon, 'layout-grid' | 'users'>, LucideIcon> = {
    user: User,
    'user-plus': UserPlus,
    shield: Shield,
    'sliders-horizontal': SlidersHorizontal,
    package: Package,
    'file-text': FileText,
    info: Info,
    database: Database,
    'building-2': Building2,
    layers: Layers,
};

function SettingsItemIcon({ icon }: { icon?: SidebarNavIcon }) {
    if (!icon || icon === 'layout-grid' || icon === 'users') {
        return null;
    }
    const Comp = settingsIconComponents[icon];
    return <Comp className="size-4 shrink-0" />;
}

export function NavSettings({
    items,
    sidebarAllHrefs,
}: {
    items: SidebarNavItem[];
    sidebarAllHrefs: NonNullable<InertiaLinkProps['href']>[];
}) {
    const page = usePage<SharedData>();
    const pageUrl = page.url;
    const settingsLabel = page.props.ui?.nav.settings ?? 'Settings';

    const isUnderSettings = useMemo(
        () => items.some((item) => isNavItemActive(pageUrl, item.href)),
        [items, pageUrl],
    );

    const [expandedWhenIdle, setExpandedWhenIdle] = useState(true);

    const open = isUnderSettings || expandedWhenIdle;

    const onOpenChange = (next: boolean) => {
        if (isUnderSettings) {
            return;
        }
        setExpandedWhenIdle(next);
    };

    if (items.length === 0) {
        return null;
    }

    return (
        <Collapsible open={open} onOpenChange={onOpenChange} className="group/collapsible">
            <SidebarGroup>
                <SidebarGroupLabel
                    asChild
                    className="group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                    <CollapsibleTrigger className="flex w-full items-center gap-2 outline-none">
                        <Settings2 className="size-4 shrink-0" />
                        <span className="truncate">{settingsLabel}</span>
                        <ChevronRight className="ml-auto size-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isSidebarNavItemActive(
                                            pageUrl,
                                            item.href,
                                            sidebarAllHrefs,
                                        )}
                                        tooltip={{ children: item.title }}
                                        className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:hover:bg-primary/90"
                                    >
                                        <Link href={item.href} prefetch className="flex items-center gap-2">
                                            <SettingsItemIcon icon={item.icon} />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </CollapsibleContent>
            </SidebarGroup>
        </Collapsible>
    );
}

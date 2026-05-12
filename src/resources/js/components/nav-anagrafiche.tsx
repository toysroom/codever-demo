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
    ChevronRight,
    ClipboardList,
    FolderTree,
    Layers,
    Library,
    Package,
    Tags,
    type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const anagraficheIcons: Partial<Record<SidebarNavIcon, LucideIcon>> = {
    'folder-tree': FolderTree,
    'clipboard-list': ClipboardList,
    package: Package,
    tags: Tags,
    layers: Layers,
};

function AnagraficheItemIcon({ icon }: { icon?: SidebarNavIcon }) {
    if (!icon) {
        return null;
    }
    const Comp = anagraficheIcons[icon];
    return Comp ? <Comp className="size-4 shrink-0" /> : null;
}

export function NavAnagrafiche({
    items,
    sidebarAllHrefs,
}: {
    items: SidebarNavItem[];
    sidebarAllHrefs: NonNullable<InertiaLinkProps['href']>[];
}) {
    const page = usePage<SharedData>();
    const pageUrl = page.url;
    const label = page.props.ui?.nav.anagrafiche ?? 'Anagrafiche';

    const isUnderSection = useMemo(
        () => items.some((item) => isNavItemActive(pageUrl, item.href)),
        [items, pageUrl],
    );

    const [expandedWhenIdle, setExpandedWhenIdle] = useState(true);

    const open = isUnderSection || expandedWhenIdle;

    const onOpenChange = (next: boolean) => {
        if (isUnderSection) {
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
                        <Library className="size-4 shrink-0" />
                        <span className="truncate">{label}</span>
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
                                            <AnagraficheItemIcon icon={item.icon} />
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

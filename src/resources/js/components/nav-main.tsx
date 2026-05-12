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
import { isNavItemActive, isSidebarNavItemActive, resolveUrl } from '@/lib/utils';
import { type NavItem, type SharedData } from '@/types';
import { type InertiaLinkProps, Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

export function NavMain({
    items = [],
    sidebarAllHrefs,
}: {
    items?: NavItem[];
    sidebarAllHrefs: NonNullable<InertiaLinkProps['href']>[];
}) {
    const page = usePage<SharedData>();
    const pageUrl = page.url;
    const sectionLabel = page.props.ui?.nav.menu ?? 'Menu';

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
                        <span className="truncate">{sectionLabel}</span>
                        <ChevronRight className="ml-auto size-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => {
                                const active = isSidebarNavItemActive(
                                    pageUrl,
                                    item.href,
                                    sidebarAllHrefs,
                                );
                                return (
                                    <SidebarMenuItem key={resolveUrl(item.href)}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={active}
                                            tooltip={{ children: item.title }}
                                            className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:hover:bg-primary/90"
                                        >
                                            <Link href={item.href} prefetch className="flex items-center gap-2">
                                                {item.icon ? (
                                                    <item.icon className="size-4 shrink-0" />
                                                ) : null}
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </CollapsibleContent>
            </SidebarGroup>
        </Collapsible>
    );
}

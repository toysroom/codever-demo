import { NavAnagrafiche } from '@/components/nav-anagrafiche';
import { NavMain } from '@/components/nav-main';
import { NavWeb } from '@/components/nav-web';
import { NavAccountModules } from '@/components/nav-account-modules';
import { NavSettings } from '@/components/nav-settings';
import { NavUser } from '@/components/nav-user';
import { SidebarDateTimeFooter } from '@/components/sidebar-datetime-footer';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem, type SharedData } from '@/types';
import { type InertiaLinkProps, Link, usePage } from '@inertiajs/react';
import { Building2, Landmark, LayoutGrid, Users } from 'lucide-react';
import { useMemo } from 'react';
import AppLogo from './app-logo';

const iconMap = {
    'layout-grid': LayoutGrid,
    users: Users,
    'building-2': Building2,
    landmark: Landmark,
} as const;

export function AppSidebar() {
    const page = usePage<SharedData>();
    const sidebarNavItems = page.props.sidebarNavItems;
    const anagraficheNavItems = page.props.anagraficheNavItems;
    const webNavItemsRaw = page.props.webNavItems;
    const accountModulesNavItems = page.props.accountModulesNavItems;
    const settingsNavItems = page.props.settingsNavItems;

    const mainNavItems: NavItem[] = useMemo(() => {
        const fromServer = sidebarNavItems ?? [];
        return fromServer.length > 0
            ? fromServer.map((item) => ({
                  title: item.title,
                  href: item.href,
                  icon: item.icon ? iconMap[item.icon] ?? LayoutGrid : LayoutGrid,
              }))
            : [
                  {
                      title: 'Dashboard',
                      href: dashboard(),
                      icon: LayoutGrid,
                  },
              ];
    }, [sidebarNavItems]);

    const anagraficheItems = useMemo(() => anagraficheNavItems ?? [], [anagraficheNavItems]);
    const webNavItems = useMemo(() => webNavItemsRaw ?? [], [webNavItemsRaw]);
    const accountModulesItems = useMemo(() => accountModulesNavItems ?? [], [accountModulesNavItems]);
    const settingsItems = useMemo(() => settingsNavItems ?? [], [settingsNavItems]);

    const sidebarAllHrefs = useMemo((): NonNullable<InertiaLinkProps['href']>[] => {
        const hrefs: NonNullable<InertiaLinkProps['href']>[] = [];
        for (const item of mainNavItems) {
            hrefs.push(item.href);
        }
        for (const item of anagraficheItems) {
            hrefs.push(item.href);
        }
        for (const item of webNavItems) {
            hrefs.push(item.href);
        }
        for (const item of accountModulesItems) {
            hrefs.push(item.href);
        }
        for (const item of settingsItems) {
            hrefs.push(item.href);
        }
        return hrefs;
    }, [mainNavItems, anagraficheItems, webNavItems, accountModulesItems, settingsItems]);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="gap-0">
                <NavMain items={mainNavItems} sidebarAllHrefs={sidebarAllHrefs} />
                <NavAnagrafiche items={anagraficheItems} sidebarAllHrefs={sidebarAllHrefs} />
                <NavWeb items={webNavItems} sidebarAllHrefs={sidebarAllHrefs} />
                <NavAccountModules items={accountModulesItems} sidebarAllHrefs={sidebarAllHrefs} />
                <NavSettings items={settingsItems} sidebarAllHrefs={sidebarAllHrefs} />
            </SidebarContent>
            <SidebarRail />

            <SidebarFooter>
                <SidebarDateTimeFooter />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { type ReactNode } from 'react';

type PageLayoutProps = {
    title: string;
    description?: string;
    breadcrumbs?: BreadcrumbItem[];
    headerActions?: ReactNode;
    children?: ReactNode;
};

export default function PageLayout({
    title,
    description,
    breadcrumbs = [],
    headerActions,
    children,
}: PageLayoutProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
                        {description ? <p className="max-w-3xl text-sm text-muted-foreground">{description}</p> : null}
                    </div>
                    {headerActions ? <div className="flex shrink-0 flex-wrap gap-2">{headerActions}</div> : null}
                </div>
                {children}
            </div>
        </AppLayout>
    );
}

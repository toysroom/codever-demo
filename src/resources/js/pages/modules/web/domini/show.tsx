import { WebDomainCrudPage, type WebDomainCrudPageProps } from '@/components/domains/web/web-domain-crud-page';

export default function DomainsShow(props: Omit<WebDomainCrudPageProps, 'variant'>) {
    return <WebDomainCrudPage variant="show" {...props} />;
}

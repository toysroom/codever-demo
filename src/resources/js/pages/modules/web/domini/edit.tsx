import { WebDomainCrudPage, type WebDomainCrudPageProps } from '@/components/domains/web/web-domain-crud-page';

export default function DomainsEdit(props: Omit<WebDomainCrudPageProps, 'variant'>) {
    return <WebDomainCrudPage variant="edit" {...props} />;
}

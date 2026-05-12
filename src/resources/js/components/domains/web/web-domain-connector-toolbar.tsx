import { WebDomainConnectorUploadButton } from '@/components/domains/web/web-domain-connector-upload-button';
import { WebDomainWpConnectorPluginCheckButton } from '@/components/domains/web/web-domain-wp-connector-plugin-check-button';
import { WebDomainWpConnectorPanel } from '@/components/domains/web/web-domain-wp-connector-panel';

export function WebDomainConnectorToolbar({
    domainId,
    hasFtpAccounts,
    wpConnectorTokenConfigured,
    disabled,
}: {
    domainId: number;
    hasFtpAccounts: boolean;
    wpConnectorTokenConfigured: boolean;
    disabled: boolean;
}) {
    return (
        <>
            <WebDomainWpConnectorPluginCheckButton domainId={domainId} disabled={disabled} />
            <WebDomainConnectorUploadButton domainId={domainId} disabled={!hasFtpAccounts || disabled} />
            <WebDomainWpConnectorPanel
                domainId={domainId}
                disabled={!hasFtpAccounts || disabled}
                wpConnectorTokenConfigured={wpConnectorTokenConfigured}
            />
        </>
    );
}

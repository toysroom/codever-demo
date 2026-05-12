import InputError from '@/components/input-error';
import { MemberAccountSelect, NativeSelect } from '@/components/custom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { MemberOwnerOption } from '@/types';

export interface WebDomainRelOption {
    id: number;
    member_id: number;
    label: string;
}

export type WebDomainAnagraficaFormSlice = {
    member_id: number;
    hostname: string;
    customer_id: number;
    company_id: number;
    notes: string;
};

type AnagraficaErrors = {
    member_id?: string;
    hostname?: string;
    customer_id?: string;
    company_id?: string;
    notes?: string;
};

/** Allineato a `setData` di Inertia (`useForm`) sullo slice anagrafica. */
type SetAnagraficaData = (key: keyof WebDomainAnagraficaFormSlice, value: unknown) => void;

export function WebDomainAnagraficaFields({
    readOnly = false,
    data,
    setData,
    errors,
    memberOwners,
    customersFiltered,
    companiesFiltered,
}: {
    readOnly?: boolean;
    data: WebDomainAnagraficaFormSlice;
    setData: SetAnagraficaData;
    errors: AnagraficaErrors;
    memberOwners: MemberOwnerOption[];
    customersFiltered: WebDomainRelOption[];
    companiesFiltered: WebDomainRelOption[];
}) {
    return (
        <>
            <MemberAccountSelect
                options={memberOwners}
                value={data.member_id}
                onValueChange={(id) => setData('member_id', id)}
                error={errors.member_id}
                disabled={readOnly}
            />
            <div className="grid gap-2">
                <Label htmlFor="hostname">URL del sito</Label>
                <Input
                    id="hostname"
                    value={data.hostname}
                    onChange={(e) => setData('hostname', e.target.value)}
                    required={!readOnly}
                    readOnly={readOnly}
                    placeholder="https://www.esempio.it/"
                    className="font-mono"
                    autoComplete="off"
                />
                <InputError message={errors.hostname} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="customer_id">Cliente</Label>
                <NativeSelect
                    id="customer_id"
                    value={data.customer_id ? String(data.customer_id) : ''}
                    onChange={(e) => setData('customer_id', Number(e.target.value))}
                    disabled={readOnly}
                >
                    {customersFiltered.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.label}
                        </option>
                    ))}
                </NativeSelect>
                <InputError message={errors.customer_id} />
                {customersFiltered.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Nessun cliente per questo account.</p>
                ) : null}
            </div>
            <div className="grid gap-2">
                <Label htmlFor="company_id">Azienda</Label>
                <NativeSelect
                    id="company_id"
                    value={data.company_id ? String(data.company_id) : ''}
                    onChange={(e) => setData('company_id', Number(e.target.value))}
                    disabled={readOnly}
                >
                    {companiesFiltered.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.label}
                        </option>
                    ))}
                </NativeSelect>
                <InputError message={errors.company_id} />
                {companiesFiltered.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Nessuna azienda per questo account.</p>
                ) : null}
            </div>
            <div className="grid gap-2">
                <Label htmlFor="notes">Note</Label>
                <Textarea
                    id="notes"
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    rows={3}
                    readOnly={readOnly}
                />
            </div>
        </>
    );
}

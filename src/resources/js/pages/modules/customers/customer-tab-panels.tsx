import InputError from '@/components/input-error';
import { MemberAccountSelect, NativeSelect } from '@/components/custom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO } from 'date-fns';
import type { MemberOwnerOption } from '@/types';
import { Plus, Trash2 } from 'lucide-react';

export type ContactRow = {
    type: string;
    label: string;
    value: string;
};

export type CrmNoteRow = {
    id: number;
    body: string;
    reminder_at: string | null;
    reminder_notified_at: string | null;
    author?: { id: number; name: string } | null;
    created_at: string | null;
};

export type NewCrmNote = {
    body: string;
    reminder_at: string;
    timezone: string;
};

export type CustomerTabFormData = {
    member_id: number;
    external_code: string;
    company_name: string;
    reference_person: string;
    entity_type: string;
    first_name: string;
    last_name: string;
    vat_number: string;
    fiscal_code: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone: string;
    mobile_phone: string;
    fax: string;
    contact_email: string;
    pec: string;
    sdi_recipient_code: string;
    website: string;
    notes: string;
    bank_name: string;
    iban: string;
    address: string;
    street: string;
    city: string;
    postal_code: string;
    province: string;
    country: string;
    mark_email_verified: boolean;
    contacts: ContactRow[];
    new_crm_note: NewCrmNote;
    customer_type_ids: number[];
};

const CONTACT_TYPES: { value: string; label: string }[] = [
    { value: 'mobile', label: 'Cellulare' },
    { value: 'landline', label: 'Telefono fisso' },
    { value: 'email', label: 'Email' },
    { value: 'fax', label: 'Fax' },
    { value: 'pec', label: 'PEC' },
    { value: 'other', label: 'Altro' },
];

type SetDataFn = <K extends keyof CustomerTabFormData>(key: K, value: CustomerTabFormData[K]) => void;

type CustomerTypeOption = { id: number; name: string; member_id: number };

type Props = {
    readOnly: boolean;
    memberOwners: MemberOwnerOption[];
    data: CustomerTabFormData;
    /** Opzionale in sola lettura (nessun aggiornamento stato) */
    setData?: SetDataFn;
    errors: Record<string, string>;
    crmNotes?: CrmNoteRow[];
    /** In create non ci sono note salvate */
    showPasswordFields?: boolean;
    /** Solo lettura: etichetta account */
    memberLabel?: string | null;
    /** Tipi cliente selezionabili (filtrati per account in UI) */
    customerTypeOptions?: CustomerTypeOption[];
    /** Sola lettura: tipi già assegnati */
    assignedCustomerTypes?: { id: number; name: string }[];
};

export function CustomerTabPanels({
    readOnly,
    memberOwners,
    data,
    setData: setDataProp,
    errors,
    crmNotes = [],
    showPasswordFields = true,
    memberLabel = null,
    customerTypeOptions = [],
    assignedCustomerTypes = [],
}: Props) {
    const setData: SetDataFn = setDataProp ?? (() => {});

    const addContact = () => {
        setData('contacts', [...data.contacts, { type: 'mobile', label: '', value: '' }]);
    };

    const updateContact = (index: number, patch: Partial<ContactRow>) => {
        const next = data.contacts.map((row, i) => (i === index ? { ...row, ...patch } : row));
        setData('contacts', next);
    };

    const removeContact = (index: number) => {
        setData(
            'contacts',
            data.contacts.filter((_, i) => i !== index),
        );
    };

    const typesForMember = customerTypeOptions.filter((t) => t.member_id === data.member_id);

    const toggleCustomerType = (typeId: number) => {
        const next = new Set(data.customer_type_ids);
        if (next.has(typeId)) {
            next.delete(typeId);
        } else {
            next.add(typeId);
        }
        setData('customer_type_ids', [...next]);
    };

    return (
        <Tabs defaultValue="anagrafica" className="w-full">
            <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1">
                <TabsTrigger value="anagrafica">Anagrafica</TabsTrigger>
                <TabsTrigger value="tipi">Tipi cliente</TabsTrigger>
                <TabsTrigger value="fiscale">Fiscale e pagamenti</TabsTrigger>
                <TabsTrigger value="indirizzo">Indirizzo</TabsTrigger>
                <TabsTrigger value="contatti">Contatti</TabsTrigger>
                <TabsTrigger value="crm">Note / CRM</TabsTrigger>
            </TabsList>

            <TabsContent value="anagrafica" className="space-y-4">
                {readOnly && memberLabel ? (
                    <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                        <span className="text-muted-foreground">Account: </span>
                        {memberLabel}
                    </div>
                ) : null}
                {!readOnly ? (
                    <MemberAccountSelect
                        options={memberOwners}
                        value={data.member_id}
                        onValueChange={(id) => setData('member_id', id)}
                        error={errors.member_id}
                        disabled={readOnly}
                        hideWhenSingle
                        required
                    />
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="external_code">Codice (rubrica)</Label>
                        <Input
                            id="external_code"
                            value={data.external_code}
                            disabled={readOnly}
                            onChange={(e) => setData('external_code', e.target.value)}
                            placeholder="es. codice gestionale"
                        />
                        <InputError message={errors.external_code} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="entity_type">Tipo (CLIENTE / FORNITORE / …)</Label>
                        <Input
                            id="entity_type"
                            value={data.entity_type}
                            disabled={readOnly}
                            onChange={(e) => setData('entity_type', e.target.value)}
                            placeholder="es. CLIENTE/FORNITORE"
                        />
                        <InputError message={errors.entity_type} />
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="company_name">Ragione sociale</Label>
                    <Input
                        id="company_name"
                        value={data.company_name}
                        disabled={readOnly}
                        onChange={(e) => setData('company_name', e.target.value)}
                    />
                    <InputError message={errors.company_name} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="reference_person">Riferimento</Label>
                    <Input
                        id="reference_person"
                        value={data.reference_person}
                        disabled={readOnly}
                        onChange={(e) => setData('reference_person', e.target.value)}
                    />
                    <InputError message={errors.reference_person} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="first_name">Nome</Label>
                        <Input
                            id="first_name"
                            value={data.first_name}
                            disabled={readOnly}
                            onChange={(e) => setData('first_name', e.target.value)}
                            required={!readOnly}
                        />
                        <InputError message={errors.first_name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="last_name">Cognome</Label>
                        <Input
                            id="last_name"
                            value={data.last_name}
                            disabled={readOnly}
                            onChange={(e) => setData('last_name', e.target.value)}
                            required={!readOnly}
                        />
                        <InputError message={errors.last_name} />
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email (login)</Label>
                    <Input
                        id="email"
                        type="email"
                        value={data.email}
                        disabled={readOnly}
                        onChange={(e) => setData('email', e.target.value)}
                        required={!readOnly}
                    />
                    <InputError message={errors.email} />
                </div>
                {showPasswordFields ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="password">{readOnly ? 'Password' : 'Password'}</Label>
                            <Input
                                id="password"
                                type="password"
                                value={data.password}
                                disabled={readOnly}
                                onChange={(e) => setData('password', e.target.value)}
                                autoComplete="new-password"
                                placeholder={readOnly ? '—' : undefined}
                            />
                            <InputError message={errors.password} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">Conferma password</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={data.password_confirmation}
                                disabled={readOnly}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                autoComplete="new-password"
                            />
                        </div>
                    </div>
                ) : null}
                {!readOnly && showPasswordFields ? (
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="mark_email_verified"
                            checked={data.mark_email_verified}
                            onCheckedChange={(v) => setData('mark_email_verified', v === true)}
                        />
                        <Label htmlFor="mark_email_verified">Segna email come verificata</Label>
                    </div>
                ) : null}
                <div className="grid gap-2">
                    <Label htmlFor="notes_scheda">Nota (testo libero, come in rubrica)</Label>
                    <Textarea
                        id="notes_scheda"
                        rows={3}
                        value={data.notes}
                        disabled={readOnly}
                        onChange={(e) => setData('notes', e.target.value)}
                    />
                    <InputError message={errors.notes} />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="grid gap-2">
                        <Label htmlFor="phone_anag">Telefono</Label>
                        <Input
                            id="phone_anag"
                            type="tel"
                            value={data.phone}
                            disabled={readOnly}
                            onChange={(e) => setData('phone', e.target.value)}
                        />
                        <InputError message={errors.phone} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="mobile_phone">Cellulare</Label>
                        <Input
                            id="mobile_phone"
                            type="tel"
                            value={data.mobile_phone}
                            disabled={readOnly}
                            onChange={(e) => setData('mobile_phone', e.target.value)}
                        />
                        <InputError message={errors.mobile_phone} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="fax_anag">Fax</Label>
                        <Input id="fax_anag" type="tel" value={data.fax} disabled={readOnly} onChange={(e) => setData('fax', e.target.value)} />
                        <InputError message={errors.fax} />
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="tipi" className="space-y-4">
                {readOnly ? (
                    <div className="flex flex-wrap gap-2">
                        {assignedCustomerTypes.length === 0 ? (
                            <p className="text-muted-foreground text-sm">Nessun tipo assegnato.</p>
                        ) : (
                            assignedCustomerTypes.map((t) => (
                                <span
                                    key={t.id}
                                    className="bg-muted text-muted-foreground rounded-md px-2 py-1 text-xs font-medium"
                                >
                                    {t.name}
                                </span>
                            ))
                        )}
                    </div>
                ) : typesForMember.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        Nessun tipo disponibile per questo account. Creane da{' '}
                        <span className="font-medium text-foreground">Anagrafiche → Tipi cliente</span>.
                    </p>
                ) : (
                    <div className="grid gap-3">
                        <p className="text-muted-foreground text-sm">
                            Seleziona uno o più tipi (classificazione molti-a-molti).
                        </p>
                        <div className="flex flex-col gap-2">
                            {typesForMember.map((t) => (
                                <label key={t.id} className="flex cursor-pointer items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={data.customer_type_ids.includes(t.id)}
                                        onCheckedChange={() => toggleCustomerType(t.id)}
                                    />
                                    <span>{t.name}</span>
                                </label>
                            ))}
                        </div>
                        <InputError message={errors.customer_type_ids} />
                    </div>
                )}
            </TabsContent>

            <TabsContent value="fiscale" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="vat_number">Partita IVA</Label>
                        <Input id="vat_number" value={data.vat_number} disabled={readOnly} onChange={(e) => setData('vat_number', e.target.value)} />
                        <InputError message={errors.vat_number} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="fiscal_code">Codice fiscale</Label>
                        <Input id="fiscal_code" value={data.fiscal_code} disabled={readOnly} onChange={(e) => setData('fiscal_code', e.target.value)} />
                        <InputError message={errors.fiscal_code} />
                    </div>
                </div>
                <div className="grid gap-2 sm:max-w-md">
                    <Label htmlFor="sdi_recipient_code">Codice destinatario (SDI)</Label>
                    <Input
                        id="sdi_recipient_code"
                        value={data.sdi_recipient_code}
                        disabled={readOnly}
                        onChange={(e) => setData('sdi_recipient_code', e.target.value)}
                        maxLength={16}
                    />
                    <InputError message={errors.sdi_recipient_code} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="contact_email">Email (aziendale)</Label>
                        <Input
                            id="contact_email"
                            type="email"
                            value={data.contact_email}
                            disabled={readOnly}
                            onChange={(e) => setData('contact_email', e.target.value)}
                        />
                        <InputError message={errors.contact_email} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="pec">PEC</Label>
                        <Input id="pec" type="email" value={data.pec} disabled={readOnly} onChange={(e) => setData('pec', e.target.value)} />
                        <InputError message={errors.pec} />
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="website">Sito web</Label>
                    <Input
                        id="website"
                        type="text"
                        value={data.website}
                        disabled={readOnly}
                        onChange={(e) => setData('website', e.target.value)}
                        placeholder="https://"
                    />
                    <InputError message={errors.website} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="bank_name">Nome banca</Label>
                        <Input id="bank_name" value={data.bank_name} disabled={readOnly} onChange={(e) => setData('bank_name', e.target.value)} />
                        <InputError message={errors.bank_name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="iban">IBAN</Label>
                        <Input id="iban" value={data.iban} disabled={readOnly} onChange={(e) => setData('iban', e.target.value)} autoComplete="off" />
                        <InputError message={errors.iban} />
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="indirizzo" className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="street">Via e numero civico</Label>
                    <Input id="street" value={data.street} disabled={readOnly} onChange={(e) => setData('street', e.target.value)} />
                    <InputError message={errors.street} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="city">Città</Label>
                        <Input id="city" value={data.city} disabled={readOnly} onChange={(e) => setData('city', e.target.value)} />
                        <InputError message={errors.city} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="postal_code">CAP</Label>
                        <Input id="postal_code" value={data.postal_code} disabled={readOnly} onChange={(e) => setData('postal_code', e.target.value)} />
                        <InputError message={errors.postal_code} />
                    </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="province">Provincia</Label>
                        <Input id="province" value={data.province} disabled={readOnly} onChange={(e) => setData('province', e.target.value)} />
                        <InputError message={errors.province} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="country">Paese</Label>
                        <Input id="country" value={data.country} disabled={readOnly} onChange={(e) => setData('country', e.target.value)} />
                        <InputError message={errors.country} />
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="address">Note indirizzo / interno / scale</Label>
                    <Textarea id="address" rows={3} value={data.address} disabled={readOnly} onChange={(e) => setData('address', e.target.value)} />
                    <InputError message={errors.address} />
                </div>
            </TabsContent>

            <TabsContent value="contatti" className="space-y-4">
                <p className="text-sm text-muted-foreground">Aggiungi contatti aggiuntivi (referenti, numeri alternativi, ecc.).</p>
                {data.contacts.length === 0 && readOnly ? <p className="text-sm text-muted-foreground">Nessun contatto aggiuntivo.</p> : null}
                {data.contacts.map((row, index) => (
                    <div key={index} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-end">
                        <div className="grid flex-1 gap-2 sm:grid-cols-3">
                            <div className="grid gap-2">
                                <Label>Tipo</Label>
                                <NativeSelect
                                    value={row.type}
                                    disabled={readOnly}
                                    onChange={(e) => updateContact(index, { type: e.target.value })}
                                >
                                    {CONTACT_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </div>
                            <div className="grid gap-2">
                                <Label>Etichetta</Label>
                                <Input value={row.label} disabled={readOnly} onChange={(e) => updateContact(index, { label: e.target.value })} placeholder="es. Ufficio acquisti" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Valore</Label>
                                <Input value={row.value} disabled={readOnly} onChange={(e) => updateContact(index, { value: e.target.value })} />
                            </div>
                        </div>
                        {!readOnly ? (
                            <Button type="button" variant="outline" size="icon" onClick={() => removeContact(index)} aria-label="Rimuovi contatto">
                                <Trash2 className="size-4" />
                            </Button>
                        ) : null}
                    </div>
                ))}
                {!readOnly ? (
                    <Button type="button" variant="secondary" size="sm" onClick={addContact}>
                        <Plus className="mr-2 size-4" />
                        Aggiungi contatto
                    </Button>
                ) : null}
                <InputError message={errors.contacts} />
            </TabsContent>

            <TabsContent value="crm" className="space-y-6">
                <div>
                    <h3 className="mb-2 text-sm font-medium">Cronologia note</h3>
                    {crmNotes.length === 0 ? <p className="text-sm text-muted-foreground">Nessuna nota.</p> : null}
                    <ul className="space-y-3">
                        {crmNotes.map((n) => (
                            <li key={n.id} className="rounded-lg border p-3 text-sm">
                                <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                    <span>
                                        {n.author?.name ?? '—'} · {n.created_at ? format(parseISO(n.created_at), 'dd/MM/yyyy HH:mm') : '—'}
                                    </span>
                                    {n.reminder_at ? (
                                        <span className="rounded bg-muted px-2 py-0.5">
                                            Promemoria: {format(parseISO(n.reminder_at), 'dd/MM/yyyy HH:mm')}
                                            {n.reminder_notified_at ? ' · inviato' : ''}
                                        </span>
                                    ) : null}
                                </div>
                                <p className="whitespace-pre-wrap">{n.body}</p>
                            </li>
                        ))}
                    </ul>
                </div>
                {!readOnly ? (
                    <div className="rounded-lg border border-dashed p-4">
                        <h3 className="mb-3 text-sm font-medium">Nuova nota</h3>
                        <div className="grid gap-3">
                            <div className="grid gap-2">
                                <Label htmlFor="crm_body">Testo</Label>
                                <Textarea
                                    id="crm_body"
                                    rows={4}
                                    value={data.new_crm_note.body}
                                    onChange={(e) =>
                                        setData('new_crm_note', {
                                            ...data.new_crm_note,
                                            body: e.target.value,
                                        })
                                    }
                                />
                                <InputError message={errors['new_crm_note.body']} />
                            </div>
                            <div className="grid gap-2 sm:max-w-xs">
                                <Label htmlFor="crm_reminder">Promemoria (invio email e notifica in app)</Label>
                                <Input
                                    id="crm_reminder"
                                    type="datetime-local"
                                    value={data.new_crm_note.reminder_at}
                                    onChange={(e) =>
                                        setData('new_crm_note', {
                                            ...data.new_crm_note,
                                            reminder_at: e.target.value,
                                        })
                                    }
                                />
                                <p className="text-xs text-muted-foreground">Lo scheduler Laravel (`customer-crm:dispatch-reminders`) invia in coda Mail + notifica database.</p>
                                <InputError message={errors['new_crm_note.reminder_at']} />
                                <InputError message={errors['new_crm_note.timezone']} />
                            </div>
                        </div>
                    </div>
                ) : null}
            </TabsContent>
        </Tabs>
    );
}

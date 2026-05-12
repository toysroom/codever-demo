import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import type { MemberOwnerOption } from '@/types';
import { NativeSelect } from './native-select';

type MemberAccountSelectProps = {
    options: MemberOwnerOption[];
    value: number;
    onValueChange: (memberId: number) => void;
    error?: string;
    label?: string;
    id?: string;
    disabled?: boolean;
    required?: boolean;
    /**
     * Se true e c’è un solo account, non renderizza UI (il `member_id` è già nel form state).
     * Usare nei tab cliente dove il select appare solo con più tenant.
     */
    hideWhenSingle?: boolean;
};

/** Select “Account” / tenant owner ripetuta nei form modulo; con un solo account usa input hidden. */
export function MemberAccountSelect({
    options,
    value,
    onValueChange,
    error,
    label = 'Account',
    id = 'member_id',
    disabled = false,
    required = false,
    hideWhenSingle = false,
}: MemberAccountSelectProps) {
    if (options.length === 0) {
        return null;
    }

    if (options.length === 1) {
        if (hideWhenSingle) {
            return null;
        }
        const onlyId = options[0].id;
        return (
            <>
                <input type="hidden" name={id} value={onlyId} readOnly aria-hidden />
                <InputError message={error} />
            </>
        );
    }

    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <NativeSelect
                id={id}
                name={id}
                value={String(value)}
                disabled={disabled}
                required={required}
                onChange={(e) => onValueChange(Number(e.target.value))}
            >
                {options.map((m) => (
                    <option key={m.id} value={m.id}>
                        {m.label}
                    </option>
                ))}
            </NativeSelect>
            <InputError message={error} />
        </div>
    );
}

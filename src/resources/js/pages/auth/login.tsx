import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, Head, router } from '@inertiajs/react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
    currentLocale?: string;
    availableLocales?: Record<string, string>;
    translations?: {
        title: string;
        description: string;
        email: string;
        password: string;
        remember_me: string;
        forgot_password: string;
        button: string;
        no_account: string;
        sign_up: string;
        email_placeholder: string;
        password_placeholder: string;
        change_language?: string;
    };
}

const defaultTranslations = {
    title: 'Accedi al tuo account',
    description: 'Inserisci la tua email e password per accedere',
    email: 'Indirizzo email',
    password: 'Password',
    remember_me: 'Ricordami',
    forgot_password: 'Password dimenticata?',
    button: 'Accedi',
    no_account: 'Non hai un account?',
    sign_up: 'Registrati',
    email_placeholder: 'email@esempio.com',
    password_placeholder: 'Password',
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
    currentLocale = 'it',
    availableLocales = { it: 'Italiano', en: 'English' },
    translations = defaultTranslations,
}: LoginProps) {
    const handleLocaleChange = (locale: string) => {
        router.post(
            '/locale',
            { locale },
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ preserveScroll: true });
                },
            },
        );
    };

    return (
        <AuthLayout
            title={translations.title}
            description={translations.description}
        >
            <Head title={translations.button} />

            {/* Language Selector */}
            <div className="mb-4 flex justify-end">
                <Select value={currentLocale} onValueChange={handleLocaleChange}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder={translations.change_language || 'Change language'} />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(availableLocales).map(([code, name]) => (
                            <SelectItem key={code} value={code}>
                                {name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">{translations.email}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder={translations.email_placeholder}
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">{translations.password}</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm"
                                            tabIndex={5}
                                        >
                                            {translations.forgot_password}
                                        </TextLink>
                                    )}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder={translations.password_placeholder}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember">{translations.remember_me}</Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-4 w-full"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                {translations.button}
                            </Button>
                        </div>

                        {canRegister && (
                            <div className="text-center text-sm text-muted-foreground">
                                {translations.no_account}{' '}
                                <TextLink href={register()} tabIndex={5}>
                                    {translations.sign_up}
                                </TextLink>
                            </div>
                        )}
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}

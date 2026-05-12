@php
    $env = (string) config('app.env');
    $normalized = strtolower($env);

    $bannerClasses = match (true) {
        $normalized === 'production' => 'bg-slate-800 text-white',
        in_array($normalized, ['develop', 'development', 'dev', 'staging', 'stage'], true) => 'bg-amber-500 text-slate-950',
        $normalized === 'local' => 'bg-emerald-600 text-white',
        default => 'bg-violet-700 text-white',
    };

    $label = strtoupper($env);
@endphp
<div
    data-environment-banner
    class="{{ $bannerClasses }} w-full shrink-0 border-b border-black/15 px-3 py-1.5 text-center text-xs font-semibold uppercase tracking-widest"
    role="status"
>
    {{ __('ui.environment_banner', ['env' => $label]) }}
</div>

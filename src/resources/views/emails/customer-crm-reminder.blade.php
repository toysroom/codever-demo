<x-mail::message>
# {{ __('Promemoria CRM') }}

{{ __('Cliente') }}: **{{ $customer->fullName() }}**

---

{!! nl2br(e($note->body)) !!}

@if($note->reminder_at)
<x-mail::panel>
{{ __('Data promemoria') }}: {{ $note->reminder_at->timezone(config('app.timezone'))->format('d/m/Y H:i') }}
</x-mail::panel>
@endif

<x-mail::button :url="route('modules.customers.show', $customer)">
{{ __('Apri scheda cliente') }}
</x-mail::button>

{{ __('Grazie') }},<br>
{{ config('app.name') }}
</x-mail::message>

<x-mail::message>
# {{ __('ui.deletion_communication.mail_heading') }}

{{ __('ui.deletion_communication.mail_intro', ['label' => $log->subject_label]) }}

- **{{ __('ui.deletion_communication.mail_field_type') }}:** {{ class_basename($deletedModel) }}
@if($log->causedBy)
- **{{ __('ui.deletion_communication.mail_field_operator') }}:** {{ $log->causedBy->name }} ({{ $log->causedBy->email }})
@endif

<x-mail::button :url="config('app.url')">
{{ __('ui.deletion_communication.mail_button') }}
</x-mail::button>

{{ __('ui.deletion_communication.mail_footer') }}<br>
{{ config('app.name') }}
</x-mail::message>

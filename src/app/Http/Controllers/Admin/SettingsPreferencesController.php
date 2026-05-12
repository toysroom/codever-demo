<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Preference;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsPreferencesController extends Controller
{
    public function index(): Response
    {
        $preferences = Preference::query()
            ->orderBy('id')
            ->get()
            ->map(fn (Preference $p) => [
                'id' => $p->id,
                'code' => $p->code,
                'name' => $p->name,
                'value' => (string) ($p->value ?? ''),
                'notes' => (string) ($p->notes ?? ''),
                'type' => $p->type,
                'category' => $p->category,
            ])
            ->all();

        return Inertia::render('Preferences/Index', [
            'preferences' => $preferences,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'preferences' => ['required', 'array'],
            'preferences.*.id' => ['required', 'integer', 'exists:preferences,id'],
            'preferences.*.value' => ['nullable', 'string', 'max:65535'],
        ]);

        foreach ($validated['preferences'] as $row) {
            Preference::query()->whereKey($row['id'])->update([
                'value' => $row['value'] ?? '',
            ]);
        }

        return redirect()->back()->with('success', 'Preferences saved.');
    }
}

<?php

namespace Database\Seeders;

use App\Models\Preference;
use Illuminate\Database\Seeder;

class PreferenceSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            [
                'code' => 'session_duration',
                'name' => 'Session Duration (minutes)',
                'value' => '120',
                'notes' => 'Session duration in minutes (default: 120 = 2 hours)',
                'type' => 'number',
                'category' => 'general',
            ],
            [
                'code' => 'system_timezone',
                'name' => 'System Timezone',
                'value' => 'Europe/London',
                'notes' => 'System timezone for date and time display',
                'type' => 'timezone',
                'category' => 'general',
            ],
        ];

        foreach ($rows as $row) {
            Preference::query()->updateOrCreate(
                ['code' => $row['code']],
                $row,
            );
        }
    }
}

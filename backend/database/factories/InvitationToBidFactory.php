<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\ProjectScope;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvitationToBidFactory extends Factory
{
    public function definition(): array
    {
        $status = $this->faker->randomElement(['sent', 'viewed', 'declined', 'bid_submitted']);
        $sentAt = $this->faker->dateTimeBetween('-3 months', 'now');
        $respondedAt = in_array($status, ['declined', 'bid_submitted'])
            ? $this->faker->dateTimeBetween($sentAt, 'now')
            : null;

        return [
            'project_scope_id' => ProjectScope::factory(),
            'company_id' => Company::factory()->subcontractor(),
            'status' => $status,
            'sent_at' => $sentAt,
            'responded_at' => $respondedAt,
            'notes' => $this->faker->optional()->sentence(),
        ];
    }
}

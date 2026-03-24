<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\InvitationToBid;
use App\Models\ProjectScope;
use Illuminate\Database\Eloquent\Factories\Factory;

class BidFactory extends Factory
{
    public function definition(): array
    {
        $status = $this->faker->randomElement(['submitted', 'under_review', 'accepted', 'rejected']);
        $submittedAt = $this->faker->dateTimeBetween('-2 months', 'now');
        $reviewedAt = in_array($status, ['under_review', 'accepted', 'rejected'])
            ? $this->faker->dateTimeBetween($submittedAt, 'now')
            : null;

        return [
            'invitation_id' => null,
            'company_id' => Company::factory()->subcontractor(),
            'project_scope_id' => ProjectScope::factory(),
            'amount' => $this->faker->numberBetween(50000, 3000000),
            'description' => $this->faker->paragraph(),
            'timeline_days' => $this->faker->numberBetween(30, 180),
            'status' => $status,
            'submitted_at' => $submittedAt,
            'reviewed_at' => $reviewedAt,
            'notes' => $this->faker->optional()->sentence(),
        ];
    }
}

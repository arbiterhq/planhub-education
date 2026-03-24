<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ActivityLogFactory extends Factory
{
    public function definition(): array
    {
        $actions = [
            'bid_submitted', 'bid_accepted', 'bid_rejected',
            'invoice_submitted', 'invoice_approved', 'invoice_paid',
            'contract_signed', 'itb_sent', 'project_status_changed',
        ];

        return [
            'user_id' => User::factory(),
            'company_id' => Company::factory(),
            'project_id' => Project::factory(),
            'action' => $this->faker->randomElement($actions),
            'description' => $this->faker->sentence(),
            'metadata' => null,
        ];
    }
}

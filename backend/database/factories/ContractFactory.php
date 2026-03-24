<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Project;
use App\Models\Trade;
use Illuminate\Database\Eloquent\Factories\Factory;

class ContractFactory extends Factory
{
    public function definition(): array
    {
        $status = $this->faker->randomElement(['draft', 'active', 'completed', 'terminated']);
        $startDate = $this->faker->dateTimeBetween('-1 year', '+3 months');
        $endDate = $this->faker->dateTimeBetween($startDate, '+2 years');
        $signedAt = in_array($status, ['active', 'completed'])
            ? $this->faker->dateTimeBetween('-1 year', $startDate)
            : null;

        return [
            'bid_id' => null,
            'project_id' => Project::factory(),
            'company_id' => Company::factory()->subcontractor(),
            'trade_id' => Trade::factory(),
            'amount' => $this->faker->numberBetween(50000, 3000000),
            'status' => $status,
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => $endDate->format('Y-m-d'),
            'signed_at' => $signedAt,
        ];
    }
}

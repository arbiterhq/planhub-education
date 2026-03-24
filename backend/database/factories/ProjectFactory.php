<?php

namespace Database\Factories;

use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProjectFactory extends Factory
{
    public function definition(): array
    {
        $status = $this->faker->randomElement(['planning', 'bidding', 'in_progress', 'completed', 'on_hold']);
        $startDate = $this->faker->dateTimeBetween('-1 year', '+6 months');
        $endDate = $this->faker->dateTimeBetween($startDate, '+2 years');

        return [
            'company_id' => Company::factory()->generalContractor(),
            'name' => $this->faker->company() . ' ' . $this->faker->randomElement(['Renovation', 'Construction', 'Development', 'Expansion']),
            'description' => $this->faker->paragraphs(2, true),
            'status' => $status,
            'project_type' => $this->faker->randomElement(['Commercial Office', 'Healthcare', 'Education', 'Residential', 'Industrial', 'Government']),
            'address' => $this->faker->streetAddress(),
            'city' => $this->faker->city(),
            'state' => $this->faker->stateAbbr(),
            'zip' => $this->faker->postcode(),
            'estimated_budget' => $this->faker->numberBetween(500000, 25000000),
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => $endDate->format('Y-m-d'),
            'bid_due_date' => $status === 'bidding' ? $this->faker->dateTimeBetween('now', '+3 months')->format('Y-m-d') : null,
        ];
    }
}

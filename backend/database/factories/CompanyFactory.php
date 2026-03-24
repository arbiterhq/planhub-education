<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class CompanyFactory extends Factory
{
    public function definition(): array
    {
        $type = $this->faker->randomElement(['general_contractor', 'subcontractor']);

        return [
            'name' => $this->faker->company(),
            'type' => $type,
            'description' => $this->faker->paragraph(),
            'address' => $this->faker->streetAddress(),
            'city' => $this->faker->city(),
            'state' => $this->faker->stateAbbr(),
            'zip' => $this->faker->postcode(),
            'phone' => $this->faker->phoneNumber(),
            'email' => $this->faker->companyEmail(),
            'website' => 'https://www.' . $this->faker->domainName(),
            'logo_url' => null,
            'license_number' => 'TX-GC-' . $this->faker->year() . '-' . $this->faker->numerify('#####'),
            'established_year' => $this->faker->numberBetween(1990, 2020),
            'employee_count' => $this->faker->numberBetween(10, 200),
        ];
    }

    public function generalContractor(): static
    {
        return $this->state(['type' => 'general_contractor']);
    }

    public function subcontractor(): static
    {
        return $this->state(['type' => 'subcontractor']);
    }
}

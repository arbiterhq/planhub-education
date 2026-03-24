<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class TradeFactory extends Factory
{
    public function definition(): array
    {
        $trades = [
            ['name' => 'Electrical', 'category' => 'MEP'],
            ['name' => 'Plumbing', 'category' => 'MEP'],
            ['name' => 'HVAC', 'category' => 'MEP'],
            ['name' => 'Fire Protection', 'category' => 'MEP'],
            ['name' => 'Concrete & Masonry', 'category' => 'Structural'],
            ['name' => 'Structural Steel', 'category' => 'Structural'],
            ['name' => 'Framing & Carpentry', 'category' => 'Structural'],
            ['name' => 'Roofing', 'category' => 'Exterior'],
            ['name' => 'Glazing & Windows', 'category' => 'Exterior'],
            ['name' => 'Painting', 'category' => 'Finishing'],
            ['name' => 'Drywall & Insulation', 'category' => 'Finishing'],
            ['name' => 'Flooring', 'category' => 'Finishing'],
            ['name' => 'Landscaping', 'category' => 'Site Work'],
            ['name' => 'Demolition', 'category' => 'Site Work'],
            ['name' => 'Excavation & Grading', 'category' => 'Site Work'],
            ['name' => 'Elevator Installation', 'category' => 'Specialty'],
        ];

        $trade = $this->faker->randomElement($trades);

        return [
            'name' => $trade['name'],
            'category' => $trade['category'],
        ];
    }
}

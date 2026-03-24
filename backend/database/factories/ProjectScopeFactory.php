<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\Trade;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProjectScopeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'trade_id' => Trade::factory(),
            'description' => $this->faker->paragraph(),
            'estimated_value' => $this->faker->numberBetween(50000, 3000000),
            'status' => $this->faker->randomElement(['open', 'bidding', 'awarded', 'in_progress', 'completed']),
        ];
    }
}

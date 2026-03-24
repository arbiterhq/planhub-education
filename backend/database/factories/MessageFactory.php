<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class MessageFactory extends Factory
{
    public function definition(): array
    {
        $createdAt = $this->faker->dateTimeBetween('-2 months', 'now');
        $readAt = $this->faker->boolean(60)
            ? $this->faker->dateTimeBetween($createdAt, 'now')
            : null;

        return [
            'sender_id' => User::factory(),
            'recipient_id' => User::factory(),
            'project_id' => $this->faker->boolean(80) ? Project::factory() : null,
            'subject' => $this->faker->sentence(6),
            'body' => $this->faker->paragraphs(2, true),
            'read_at' => $readAt,
        ];
    }
}

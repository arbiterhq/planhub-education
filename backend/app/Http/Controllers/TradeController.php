<?php

namespace App\Http\Controllers;

use App\Http\Resources\TradeResource;
use App\Models\Trade;

class TradeController extends Controller
{
    public function index()
    {
        return TradeResource::collection(
            Trade::orderBy('category')->orderBy('name')->get()
        );
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Duration;
use Illuminate\Http\Request;

class DurationController extends Controller
{
    public function index(Request $request)
    {
        $q = Duration::query();

        if ($status = $request->query('status')) {
            if (in_array($status, ['active','archived'])) {
                $q->where('status', $status);
            }
        }

        if ($search = $request->query('q')) {
            $q->where(function ($qq) use ($search) {
                $qq->where('name', 'like', "%$search%")
                   ->orWhere('code', 'like', "%$search%");
            });
        }

        return response()->json([
            'success' => true,
            'data' => $q->orderBy('length')->get()
        ]);
    }

    public function show($id)
    {
        $duration = Duration::findOrFail($id);
        return response()->json(['success' => true, 'data' => $duration]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:100|unique:mst_durations,name',
            'length'     => 'required|integer|min:1',
            'unit'       => 'required|in:day,week,month,year',
            'code'       => 'nullable|string|max:32|unique:mst_durations,code',
            'is_default' => 'boolean',
            'status'     => 'required|in:active,archived',
            'notes'      => 'nullable|string',
        ]);

        if (!empty($validated['is_default']) && $validated['is_default']) {
            Duration::where('is_default', true)->update(['is_default' => false]);
        }

        $duration = Duration::create($validated);

        return response()->json(['success' => true, 'data' => $duration], 201);
    }

    public function update(Request $request, $id)
    {
        $duration = Duration::findOrFail($id);

        $validated = $request->validate([
            'name'       => 'required|string|max:100|unique:mst_durations,name,' . $id,
            'length'     => 'required|integer|min:1',
            'unit'       => 'required|in:day,week,month,year',
            'code'       => 'nullable|string|max:32|unique:mst_durations,code,' . $id,
            'is_default' => 'boolean',
            'status'     => 'required|in:active,archived',
            'notes'      => 'nullable|string',
        ]);

        if (!empty($validated['is_default']) && $validated['is_default']) {
            Duration::where('id', '<>', $id)->update(['is_default' => false]);
        }

        $duration->update($validated);

        return response()->json(['success' => true, 'data' => $duration]);
    }

    public function destroy($id)
    {
        $duration = Duration::findOrFail($id);
        $duration->delete();

        return response()->json(['success' => true]);
    }
}

<?php

namespace App\Http\Controllers\Traits;

use App\Models\LevelNavItemPermission;
use App\Models\NavItem;

trait BuildMenuTree
{
    private function buildAllowedMenuTree(int $levelId): array
    {
        $allowedIds = LevelNavItemPermission::where('level_user_id', $levelId)
            ->where('access', true)
            ->pluck('nav_item_id')
            ->map(fn($v) => (int) $v)
            ->toArray();

        $items = NavItem::active()
            ->orderBy('parent_id')
            ->orderBy('order_number')
            ->get(['id','label','slug','icon','parent_id','order_number']);

        $nodes = [];
        foreach ($items as $it) {
            $nodes[$it->id] = [
                'id' => (int) $it->id,
                'label' => $it->label,
                'slug' => $it->slug,
                'icon' => $it->icon,
                'parent_id' => $it->parent_id ? (int) $it->parent_id : null,
                'order_number' => (int) $it->order_number,
                'allowed' => in_array((int) $it->id, $allowedIds, true),
                'children' => [],
            ];
        }

        $childrenMap = [];
        foreach ($nodes as $id => $n) {
            $pid = $n['parent_id'];
            $childrenMap[$pid ?? 0][] = $id;
        }

        $build = function ($parentId) use (&$build, &$nodes, &$childrenMap): array {
            $childIds = $childrenMap[$parentId ?? 0] ?? [];
            $out = [];
            foreach ($childIds as $cid) {
                $node = $nodes[$cid];
                $node['children'] = $build($cid);
                $keep = $node['allowed'] || count($node['children']) > 0;
                if ($keep) $out[] = $node;
            }
            return $out;
        };

        return $build(null);
    }
}

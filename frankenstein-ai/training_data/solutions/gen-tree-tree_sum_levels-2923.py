# Task: gen-tree-tree_sum_levels-2923 | Score: 100% | 2026-02-15T09:17:30.555581

def solve():
    n = int(input())
    nodes = {}
    for _ in range(n):
        node_id, value, parent_id = input().split()
        node_id = int(node_id)
        value = int(value)
        parent_id = int(parent_id)
        nodes[node_id] = {"value": value, "parent": parent_id, "children": []}

    for node_id, node in nodes.items():
        parent_id = node["parent"]
        if parent_id != -1:
            nodes[parent_id]["children"].append(node_id)

    root_id = None
    for node_id, node in nodes.items():
        if node["parent"] == -1:
            root_id = node_id
            break

    levels = {}
    def assign_levels(node_id, level):
        if level not in levels:
            levels[level] = []
        levels[level].append(node_id)
        for child_id in nodes[node_id]["children"]:
            assign_levels(child_id, level + 1)

    assign_levels(root_id, 0)

    level_sums = {}
    for level, node_ids in levels.items():
        level_sum = 0
        for node_id in node_ids:
            level_sum += nodes[node_id]["value"]
        level_sums[level] = level_sum

    sorted_levels = sorted(level_sums.keys())
    for level in sorted_levels:
        print(level_sums[level])

solve()
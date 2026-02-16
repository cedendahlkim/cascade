# Task: gen-tree-tree_sum_levels-5324 | Score: 100% | 2026-02-13T18:45:00.476791

def solve():
    n = int(input())
    nodes = {}
    for _ in range(n):
        node_id, value, parent_id = map(int, input().split())
        nodes[node_id] = {"value": value, "parent": parent_id, "children": []}

    root_id = None
    for node_id, node_data in nodes.items():
        if node_data["parent"] == -1:
            root_id = node_id
            break

    for node_id, node_data in nodes.items():
        if node_data["parent"] != -1:
            nodes[node_data["parent"]]["children"].append(node_id)

    levels = {}
    def assign_levels(node_id, level):
        if level not in levels:
            levels[level] = 0
        levels[level] += nodes[node_id]["value"]
        
        for child_id in nodes[node_id]["children"]:
            assign_levels(child_id, level + 1)

    assign_levels(root_id, 0)

    level_keys = sorted(levels.keys())
    for level in level_keys:
        print(levels[level])

solve()
# Task: gen-tree-tree_sum_levels-2357 | Score: 100% | 2026-02-13T18:45:48.883444

def solve():
    n = int(input())
    nodes = {}
    for _ in range(n):
        node_id, value, parent_id = map(int, input().split())
        nodes[node_id] = {'value': value, 'parent': parent_id, 'children': []}

    root_id = None
    for node_id, node in nodes.items():
        if node['parent'] == -1:
            root_id = node_id
            break

    for node_id, node in nodes.items():
        if node['parent'] != -1:
            nodes[node['parent']]['children'].append(node_id)

    queue = [(root_id, 0)]
    level_sums = {}

    while queue:
        node_id, level = queue.pop(0)
        node = nodes[node_id]

        if level not in level_sums:
            level_sums[level] = 0
        level_sums[level] += node['value']

        for child_id in node['children']:
            queue.append((child_id, level + 1))

    for level in sorted(level_sums.keys()):
        print(level_sums[level])

solve()
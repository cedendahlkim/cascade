# Task: gen-parse-csv_aggregate-9471 | Score: 100% | 2026-02-13T18:32:41.922149

n = int(input())
categories = {}
for _ in range(n):
    line = input().split(',')
    category = line[1]
    value = int(line[2])
    if category in categories:
        categories[category] += value
    else:
        categories[category] = value

sorted_categories = sorted(categories.keys())
for category in sorted_categories:
    print(f"{category}:{categories[category]}")
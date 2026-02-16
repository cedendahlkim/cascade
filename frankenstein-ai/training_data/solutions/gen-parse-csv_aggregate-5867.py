# Task: gen-parse-csv_aggregate-5867 | Score: 100% | 2026-02-15T07:58:57.273090

def solve():
    n = int(input())
    data = {}
    for _ in range(n):
        line = input().split(',')
        name = line[0]
        category = line[1]
        value = int(line[2])
        if category in data:
            data[category] += value
        else:
            data[category] = value
    
    sorted_categories = sorted(data.keys())
    
    for category in sorted_categories:
        print(f"{category}:{data[category]}")

solve()
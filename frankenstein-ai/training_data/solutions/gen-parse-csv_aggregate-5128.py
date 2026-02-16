# Task: gen-parse-csv_aggregate-5128 | Score: 100% | 2026-02-13T18:38:27.430956

n = int(input())
sums = {}
for _ in range(n):
    name, category, value = input().split(',')
    value = int(value)
    if category in sums:
        sums[category] += value
    else:
        sums[category] = value

for category in sorted(sums.keys()):
    print(f"{category}:{sums[category]}")
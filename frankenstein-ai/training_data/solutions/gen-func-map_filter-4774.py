# Task: gen-func-map_filter-4774 | Score: 100% | 2026-02-15T08:36:15.355517

n = int(input())
lst = [int(input()) for _ in range(n)]
result = [x * 3 for x in lst if x % 2 == 0]
print(' '.join(str(x) for x in result) if result else 'none')
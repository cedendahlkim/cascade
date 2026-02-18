# Task: gen-func-map_filter-3894 | Score: 100% | 2026-02-17T20:02:25.005783

n = int(input())
lst = [int(input()) for _ in range(n)]
result = [x * 3 for x in lst if x % 2 == 0]
print(' '.join(str(x) for x in result) if result else 'none')
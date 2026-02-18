# Task: gen-func-map_filter-9965 | Score: 100% | 2026-02-17T20:12:07.083603

n = int(input())
lst = [int(input()) for _ in range(n)]
result = [x * 3 for x in lst if x % 2 == 0]
print(' '.join(str(x) for x in result) if result else 'none')
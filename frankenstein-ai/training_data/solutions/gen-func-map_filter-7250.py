# Task: gen-func-map_filter-7250 | Score: 100% | 2026-02-15T09:35:22.620510

n = int(input())
lst = [int(input()) for _ in range(n)]
result = [x * 3 for x in lst if x % 2 == 0]
print(' '.join(str(x) for x in result) if result else 'none')
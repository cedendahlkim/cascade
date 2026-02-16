# Task: gen-func-map_filter-7232 | Score: 100% | 2026-02-13T12:03:18.418813

n = int(input())
lst = [int(input()) for _ in range(n)]
result = [x * 3 for x in lst if x % 2 == 0]
print(' '.join(str(x) for x in result) if result else 'none')
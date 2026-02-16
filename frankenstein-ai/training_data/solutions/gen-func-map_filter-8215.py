# Task: gen-func-map_filter-8215 | Score: 100% | 2026-02-13T15:11:10.137895

n = int(input())
lst = [int(input()) for _ in range(n)]
result = [x * 3 for x in lst if x % 2 == 0]
print(' '.join(str(x) for x in result) if result else 'none')
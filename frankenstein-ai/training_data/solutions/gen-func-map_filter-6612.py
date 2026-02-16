# Task: gen-func-map_filter-6612 | Score: 100% | 2026-02-13T10:56:20.501989

n = int(input())
lst = [int(input()) for _ in range(n)]
result = [x * 3 for x in lst if x % 2 == 0]
print(' '.join(str(x) for x in result) if result else 'none')
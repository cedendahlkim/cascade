# Task: gen-func-map_filter-2867 | Score: 100% | 2026-02-13T18:00:32.129079

n = int(input())
lst = [int(input()) for _ in range(n)]
result = [x * 3 for x in lst if x % 2 == 0]
print(' '.join(str(x) for x in result) if result else 'none')
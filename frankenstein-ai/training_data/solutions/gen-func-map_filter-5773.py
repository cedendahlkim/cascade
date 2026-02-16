# Task: gen-func-map_filter-5773 | Score: 100% | 2026-02-13T14:09:49.384280

n = int(input())
lst = [int(input()) for _ in range(n)]
result = [x * 3 for x in lst if x % 2 == 0]
print(' '.join(str(x) for x in result) if result else 'none')
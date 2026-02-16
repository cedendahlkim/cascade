# Task: gen-func-map_filter-6989 | Score: 100% | 2026-02-13T12:54:19.353510

n = int(input())
lst = [int(input()) for _ in range(n)]
result = [x * 3 for x in lst if x % 2 == 0]
print(' '.join(str(x) for x in result) if result else 'none')
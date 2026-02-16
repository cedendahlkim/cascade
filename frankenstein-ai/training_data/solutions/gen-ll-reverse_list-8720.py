# Task: gen-ll-reverse_list-8720 | Score: 100% | 2026-02-15T09:34:45.700193

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
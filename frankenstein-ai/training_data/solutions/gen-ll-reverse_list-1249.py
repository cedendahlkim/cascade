# Task: gen-ll-reverse_list-1249 | Score: 100% | 2026-02-15T09:16:41.846696

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
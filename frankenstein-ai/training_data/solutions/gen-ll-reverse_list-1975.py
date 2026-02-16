# Task: gen-ll-reverse_list-1975 | Score: 100% | 2026-02-15T13:59:25.795385

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
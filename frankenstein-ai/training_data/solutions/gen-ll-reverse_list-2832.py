# Task: gen-ll-reverse_list-2832 | Score: 100% | 2026-02-15T10:10:00.773440

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
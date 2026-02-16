# Task: gen-ll-reverse_list-7351 | Score: 100% | 2026-02-14T12:08:00.853769

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
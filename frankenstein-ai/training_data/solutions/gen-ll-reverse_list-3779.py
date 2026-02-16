# Task: gen-ll-reverse_list-3779 | Score: 100% | 2026-02-15T08:34:47.462212

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
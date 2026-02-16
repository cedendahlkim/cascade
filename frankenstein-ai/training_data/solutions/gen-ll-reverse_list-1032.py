# Task: gen-ll-reverse_list-1032 | Score: 100% | 2026-02-14T12:27:49.895839

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
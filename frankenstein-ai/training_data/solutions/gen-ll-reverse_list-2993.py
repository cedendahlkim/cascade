# Task: gen-ll-reverse_list-2993 | Score: 100% | 2026-02-13T10:00:20.013522

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
# Task: gen-ll-reverse_list-2995 | Score: 100% | 2026-02-15T12:29:19.551313

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
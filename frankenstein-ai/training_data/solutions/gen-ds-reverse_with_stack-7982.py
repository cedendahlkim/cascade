# Task: gen-ds-reverse_with_stack-7982 | Score: 100% | 2026-02-13T20:16:41.320613

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
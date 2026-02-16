# Task: gen-ds-reverse_with_stack-7924 | Score: 100% | 2026-02-13T10:14:39.749745

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
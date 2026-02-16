# Task: gen-ds-reverse_with_stack-3218 | Score: 100% | 2026-02-13T15:11:00.103288

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
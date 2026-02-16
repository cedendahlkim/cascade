# Task: gen-ds-reverse_with_stack-1750 | Score: 100% | 2026-02-13T20:01:49.809560

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
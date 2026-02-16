# Task: gen-ds-reverse_with_stack-2217 | Score: 100% | 2026-02-15T08:34:47.119592

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
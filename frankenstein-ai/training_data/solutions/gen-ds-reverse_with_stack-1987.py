# Task: gen-ds-reverse_with_stack-1987 | Score: 100% | 2026-02-15T13:31:03.010595

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
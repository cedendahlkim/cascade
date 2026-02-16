# Task: gen-ds-reverse_with_stack-3468 | Score: 100% | 2026-02-15T08:14:59.872828

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
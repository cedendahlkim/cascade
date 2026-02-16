# Task: gen-ds-reverse_with_stack-9471 | Score: 100% | 2026-02-15T09:34:18.355197

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
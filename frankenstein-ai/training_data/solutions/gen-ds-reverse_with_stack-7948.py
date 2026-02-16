# Task: gen-ds-reverse_with_stack-7948 | Score: 100% | 2026-02-15T08:35:18.133784

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
# Task: gen-ds-reverse_with_stack-4269 | Score: 100% | 2026-02-15T11:12:47.051132

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
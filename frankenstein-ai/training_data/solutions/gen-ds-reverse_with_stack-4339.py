# Task: gen-ds-reverse_with_stack-4339 | Score: 100% | 2026-02-15T10:28:59.005290

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
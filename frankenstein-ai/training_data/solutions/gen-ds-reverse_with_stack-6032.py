# Task: gen-ds-reverse_with_stack-6032 | Score: 100% | 2026-02-15T12:59:36.438362

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
# Task: gen-ds-reverse_with_stack-3632 | Score: 100% | 2026-02-15T13:31:03.644390

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
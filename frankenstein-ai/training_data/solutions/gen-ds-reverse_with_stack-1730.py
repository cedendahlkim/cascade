# Task: gen-ds-reverse_with_stack-1730 | Score: 100% | 2026-02-14T12:08:05.044301

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
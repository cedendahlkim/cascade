# Task: gen-ds-reverse_with_stack-9848 | Score: 100% | 2026-02-14T12:27:59.546440

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
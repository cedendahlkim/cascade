# Task: gen-ds-reverse_with_stack-3154 | Score: 100% | 2026-02-13T12:42:53.396952

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
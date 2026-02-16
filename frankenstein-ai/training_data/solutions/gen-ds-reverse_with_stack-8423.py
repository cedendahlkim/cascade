# Task: gen-ds-reverse_with_stack-8423 | Score: 100% | 2026-02-15T11:13:32.681952

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
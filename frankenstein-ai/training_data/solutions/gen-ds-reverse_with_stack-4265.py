# Task: gen-ds-reverse_with_stack-4265 | Score: 100% | 2026-02-13T20:49:45.313634

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
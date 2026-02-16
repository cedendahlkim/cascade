# Task: gen-ds-reverse_with_stack-1002 | Score: 100% | 2026-02-13T13:38:47.812690

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
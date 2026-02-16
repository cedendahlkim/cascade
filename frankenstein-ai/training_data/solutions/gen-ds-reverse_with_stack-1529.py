# Task: gen-ds-reverse_with_stack-1529 | Score: 100% | 2026-02-13T09:51:19.996997

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
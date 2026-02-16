# Task: gen-ds-reverse_with_stack-8727 | Score: 100% | 2026-02-13T12:51:18.868327

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
# Task: gen-ds-reverse_with_stack-7372 | Score: 100% | 2026-02-13T14:42:28.778380

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
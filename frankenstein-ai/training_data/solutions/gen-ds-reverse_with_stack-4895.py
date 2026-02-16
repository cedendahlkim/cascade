# Task: gen-ds-reverse_with_stack-4895 | Score: 100% | 2026-02-13T20:32:40.186595

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
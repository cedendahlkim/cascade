# Task: gen-ds-reverse_with_stack-1134 | Score: 100% | 2026-02-15T08:24:23.405652

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
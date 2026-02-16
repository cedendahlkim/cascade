# Task: gen-ds-reverse_with_stack-3709 | Score: 100% | 2026-02-15T12:02:39.745521

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
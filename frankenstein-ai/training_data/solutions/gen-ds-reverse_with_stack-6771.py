# Task: gen-ds-reverse_with_stack-6771 | Score: 100% | 2026-02-13T21:49:00.990188

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
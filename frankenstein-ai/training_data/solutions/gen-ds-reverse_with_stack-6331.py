# Task: gen-ds-reverse_with_stack-6331 | Score: 100% | 2026-02-13T13:47:39.021892

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
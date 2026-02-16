# Task: gen-ds-reverse_with_stack-8319 | Score: 100% | 2026-02-13T16:47:36.434492

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
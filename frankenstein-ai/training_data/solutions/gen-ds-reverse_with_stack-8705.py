# Task: gen-ds-reverse_with_stack-8705 | Score: 100% | 2026-02-15T12:02:38.685802

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
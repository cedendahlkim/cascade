# Task: gen-ds-reverse_with_stack-8315 | Score: 100% | 2026-02-13T17:35:45.719025

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
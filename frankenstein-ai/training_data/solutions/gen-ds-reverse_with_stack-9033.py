# Task: gen-ds-reverse_with_stack-9033 | Score: 100% | 2026-02-13T19:14:45.296287

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
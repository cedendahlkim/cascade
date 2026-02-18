# Task: gen-ds-reverse_with_stack-6939 | Score: 100% | 2026-02-17T20:35:02.072022

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
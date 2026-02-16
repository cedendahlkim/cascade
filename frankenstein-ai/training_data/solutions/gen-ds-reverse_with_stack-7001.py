# Task: gen-ds-reverse_with_stack-7001 | Score: 100% | 2026-02-13T13:39:00.830455

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
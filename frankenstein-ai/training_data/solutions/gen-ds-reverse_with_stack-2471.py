# Task: gen-ds-reverse_with_stack-2471 | Score: 100% | 2026-02-14T12:04:25.231700

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
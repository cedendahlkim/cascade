# Task: gen-ds-reverse_with_stack-5274 | Score: 100% | 2026-02-13T20:33:14.918525

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
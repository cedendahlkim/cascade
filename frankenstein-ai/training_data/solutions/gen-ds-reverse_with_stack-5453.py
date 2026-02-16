# Task: gen-ds-reverse_with_stack-5453 | Score: 100% | 2026-02-13T21:49:12.464683

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
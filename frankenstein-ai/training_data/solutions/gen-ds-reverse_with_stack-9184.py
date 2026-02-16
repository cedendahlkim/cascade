# Task: gen-ds-reverse_with_stack-9184 | Score: 100% | 2026-02-13T21:08:09.700690

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
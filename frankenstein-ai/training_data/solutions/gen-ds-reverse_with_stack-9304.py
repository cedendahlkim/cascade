# Task: gen-ds-reverse_with_stack-9304 | Score: 100% | 2026-02-14T13:41:34.791904

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
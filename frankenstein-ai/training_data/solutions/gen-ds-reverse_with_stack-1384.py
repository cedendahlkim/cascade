# Task: gen-ds-reverse_with_stack-1384 | Score: 100% | 2026-02-15T11:13:09.459313

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
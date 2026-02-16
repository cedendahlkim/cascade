# Task: gen-ds-reverse_with_stack-8856 | Score: 100% | 2026-02-15T09:51:09.744294

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
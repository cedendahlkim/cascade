# Task: gen-ds-reverse_with_stack-3849 | Score: 100% | 2026-02-14T13:11:47.449382

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
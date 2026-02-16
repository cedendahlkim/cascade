# Task: gen-ds-reverse_with_stack-7889 | Score: 100% | 2026-02-14T12:03:05.165325

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
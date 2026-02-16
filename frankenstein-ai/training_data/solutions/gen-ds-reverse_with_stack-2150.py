# Task: gen-ds-reverse_with_stack-2150 | Score: 100% | 2026-02-13T13:41:55.460991

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
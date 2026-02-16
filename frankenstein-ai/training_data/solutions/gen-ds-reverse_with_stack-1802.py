# Task: gen-ds-reverse_with_stack-1802 | Score: 100% | 2026-02-14T13:41:09.490991

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
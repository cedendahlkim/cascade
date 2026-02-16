# Task: gen-ds-reverse_with_stack-7347 | Score: 100% | 2026-02-15T09:51:07.094279

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
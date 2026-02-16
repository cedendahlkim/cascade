# Task: gen-ds-reverse_with_stack-7550 | Score: 100% | 2026-02-15T10:09:57.183653

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
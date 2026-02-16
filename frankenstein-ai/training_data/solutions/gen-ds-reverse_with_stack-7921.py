# Task: gen-ds-reverse_with_stack-7921 | Score: 100% | 2026-02-15T09:51:47.790874

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
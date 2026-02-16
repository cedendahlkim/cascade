# Task: gen-ds-reverse_with_stack-3126 | Score: 100% | 2026-02-13T16:06:21.912626

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
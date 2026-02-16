# Task: gen-ds-reverse_with_stack-9038 | Score: 100% | 2026-02-13T16:47:25.026910

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
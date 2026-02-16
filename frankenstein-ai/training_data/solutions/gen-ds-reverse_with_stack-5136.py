# Task: gen-ds-reverse_with_stack-5136 | Score: 100% | 2026-02-13T18:43:47.114467

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
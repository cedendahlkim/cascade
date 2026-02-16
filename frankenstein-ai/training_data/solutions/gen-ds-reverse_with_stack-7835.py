# Task: gen-ds-reverse_with_stack-7835 | Score: 100% | 2026-02-13T19:14:26.825395

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
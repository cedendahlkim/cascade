# Task: gen-ds-reverse_with_stack-7269 | Score: 100% | 2026-02-13T13:47:37.107912

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
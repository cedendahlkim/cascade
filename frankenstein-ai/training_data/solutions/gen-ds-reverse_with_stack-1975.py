# Task: gen-ds-reverse_with_stack-1975 | Score: 100% | 2026-02-13T10:14:48.490953

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
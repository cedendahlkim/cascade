# Task: gen-ds-reverse_with_stack-9919 | Score: 100% | 2026-02-15T07:46:14.214496

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
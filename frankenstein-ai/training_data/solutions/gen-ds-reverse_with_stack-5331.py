# Task: gen-ds-reverse_with_stack-5331 | Score: 100% | 2026-02-15T11:12:39.341740

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
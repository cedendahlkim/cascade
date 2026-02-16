# Task: gen-ds-reverse_with_stack-7393 | Score: 100% | 2026-02-15T10:28:39.534814

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
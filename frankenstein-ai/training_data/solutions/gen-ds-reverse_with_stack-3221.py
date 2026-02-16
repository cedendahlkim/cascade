# Task: gen-ds-reverse_with_stack-3221 | Score: 100% | 2026-02-15T10:51:12.832647

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
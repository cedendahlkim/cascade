# Task: gen-ds-reverse_with_stack-8068 | Score: 100% | 2026-02-15T07:52:59.646994

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
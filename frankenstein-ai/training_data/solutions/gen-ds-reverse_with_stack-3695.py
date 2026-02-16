# Task: gen-ds-reverse_with_stack-3695 | Score: 100% | 2026-02-15T07:49:30.882351

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
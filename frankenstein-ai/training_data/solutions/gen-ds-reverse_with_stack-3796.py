# Task: gen-ds-reverse_with_stack-3796 | Score: 100% | 2026-02-13T21:48:19.261874

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
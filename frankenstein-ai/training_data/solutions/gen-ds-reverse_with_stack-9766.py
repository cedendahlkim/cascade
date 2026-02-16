# Task: gen-ds-reverse_with_stack-9766 | Score: 100% | 2026-02-13T15:46:53.648555

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
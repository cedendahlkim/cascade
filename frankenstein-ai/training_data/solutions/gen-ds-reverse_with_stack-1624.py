# Task: gen-ds-reverse_with_stack-1624 | Score: 100% | 2026-02-13T13:39:14.379088

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
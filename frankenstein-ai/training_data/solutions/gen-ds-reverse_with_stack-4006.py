# Task: gen-ds-reverse_with_stack-4006 | Score: 100% | 2026-02-14T13:26:30.748741

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
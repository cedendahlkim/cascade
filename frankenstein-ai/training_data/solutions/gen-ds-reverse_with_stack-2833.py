# Task: gen-ds-reverse_with_stack-2833 | Score: 100% | 2026-02-15T13:30:54.827084

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
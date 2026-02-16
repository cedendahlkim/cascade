# Task: gen-ds-reverse_with_stack-3081 | Score: 100% | 2026-02-15T11:12:48.245391

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
# Task: gen-ds-reverse_with_stack-4809 | Score: 100% | 2026-02-15T09:34:18.973133

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
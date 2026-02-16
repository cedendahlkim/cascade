# Task: gen-ds-reverse_with_stack-7217 | Score: 100% | 2026-02-15T13:59:26.568194

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
# Task: gen-ds-reverse_with_stack-3322 | Score: 100% | 2026-02-13T13:42:12.077125

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
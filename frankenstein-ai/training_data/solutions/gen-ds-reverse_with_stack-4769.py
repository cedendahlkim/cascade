# Task: gen-ds-reverse_with_stack-4769 | Score: 100% | 2026-02-15T10:51:05.742034

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
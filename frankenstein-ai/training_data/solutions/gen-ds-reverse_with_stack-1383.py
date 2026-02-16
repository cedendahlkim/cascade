# Task: gen-ds-reverse_with_stack-1383 | Score: 100% | 2026-02-15T12:03:46.497877

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))